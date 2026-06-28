"""E2E test for character creation and editing."""

from playwright.sync_api import sync_playwright, Page
import sys
import time

BASE_URL = 'http://localhost:5173'
OUT_DIR = 'docs/images'
TEST_NAME = f'TestAria{int(time.time())}'
AVATAR_PATH = 'data/default-user/characters/default_Seraphina.png'


def screenshot(page: Page, name: str) -> None:
    path = f'{OUT_DIR}/{name}.png'
    page.screenshot(path=path, full_page=False)
    print(f'[screenshot] {path}')


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))

        def log_console(msg):
            if msg.type == 'error':
                print(f'[console {msg.type}] {msg.text}')

        page.on('console', log_console)

        # 1. Open characters list and navigate to create
        print('=> Opening characters list')
        page.goto(f'{BASE_URL}/')
        page.wait_for_timeout(1500)
        page.get_by_role('button', name='Create Character').click()
        page.wait_for_timeout(1000)
        page.wait_for_url('**/character/new')
        screenshot(page, 'character-create')

        # 2. Fill create form
        print('=> Filling create form')
        page.get_by_label('Name').fill(TEST_NAME)

        # Tags
        tags_input = page.locator('#character-tags')
        tags_input.fill('test')
        tags_input.press('Enter')
        tags_input.fill('ai')
        tags_input.press('Enter')

        page.get_by_label('Description').fill(
            f'{TEST_NAME} is a wandering bard who collects forgotten songs from abandoned libraries.'
        )
        page.get_by_label('Personality').fill('Curious, warm, slightly mischievous')
        page.get_by_label('Scenario').fill('A rainy evening in a quiet port town tavern')
        page.get_by_label('First Message').fill(
            '*The door creaks open and a hooded figure shakes rain from her cloak.* '
            '"I hear this place still remembers the old songs. Mind if I add one?"'
        )
        page.get_by_label('Message Example').fill(
            '<START>\n{{user}}: Who are you?\n{{char}}: Just a traveler with too many songs and not enough coin.'
        )

        # Upload avatar
        page.locator('input[type="file"]').set_input_files(AVATAR_PATH)
        page.wait_for_timeout(500)

        screenshot(page, 'character-create-filled')

        # 3. Submit and verify detail page
        print('=> Submitting create form')
        page.get_by_role('button', name='Create Character').click()
        page.wait_for_timeout(2000)

        # Should redirect to detail page
        if f'/character/' not in page.url:
            print(f'[FAIL] Expected redirect to character detail, got {page.url}')
            browser.close()
            return 1

        page.wait_for_selector('text=Start Chat', timeout=10000)
        screenshot(page, 'character-detail-created')

        created_avatar = page.url.split('/character/')[-1]
        print(f'   Created character avatar: {created_avatar}')

        # 4. Edit character
        print('=> Opening edit page')
        page.get_by_role('button', name='Edit Character').click()
        page.wait_for_timeout(1000)
        page.wait_for_url('**/edit')
        screenshot(page, 'character-edit')

        print('=> Updating description')
        page.get_by_label('Description').fill(
            f'{TEST_NAME} is a wandering bard who collects forgotten songs — '
            'and occasionally lifts a purse when no one is looking.'
        )
        screenshot(page, 'character-edit-updated')

        page.get_by_role('button', name='Save Changes').click()
        page.wait_for_timeout(2000)

        page.wait_for_selector('text=Start Chat', timeout=10000)
        screenshot(page, 'character-detail-edited')

        # 5. Cleanup: delete test character
        print('=> Deleting test character')
        csrf_response = page.request.get(f'{BASE_URL}/csrf-token')
        csrf_token = csrf_response.json().get('token', '') if csrf_response.ok else ''
        response = page.request.post(
            f'{BASE_URL}/api/characters/delete',
            data={'avatar_url': created_avatar},
            headers={
                'X-CSRF-Token': csrf_token,
                'X-Requested-With': 'Playwright',
            },
        )
        print(f'   Delete response: {response.status}')

        browser.close()

        if errors:
            print('[FAIL] Page errors detected:')
            for e in errors:
                print(f'  {e}')
            return 1

        print('[OK] Character create/edit E2E passed')
        return 0


if __name__ == '__main__':
    sys.exit(run())
