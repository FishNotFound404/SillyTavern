"""E2E test for character import."""

from playwright.sync_api import sync_playwright, Page
import sys
import time

BASE_URL = 'http://localhost:5173'
IMPORT_SOURCE = 'data/default-user/characters/default_Seraphina.png'


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

        # 1. Open characters list
        print('=> Opening characters list')
        page.goto(f'{BASE_URL}/')
        page.wait_for_timeout(1500)

        # 2. Open import modal
        print('=> Opening import modal')
        page.get_by_role('button', name='Import Character').click()
        page.wait_for_timeout(500)

        # 3. Select file
        print('=> Selecting character card')
        with page.expect_file_chooser() as fc_info:
            page.get_by_role('button', name='Choose file').click()
        filechooser = fc_info.value
        filechooser.set_files(IMPORT_SOURCE)
        page.wait_for_timeout(500)

        # 4. Submit import
        print('=> Submitting import')
        page.get_by_role('button', name='Import', exact=True).click()
        page.wait_for_timeout(2500)

        # Should redirect to character detail
        if '/character/' not in page.url:
            print(f'[FAIL] Expected redirect to character detail, got {page.url}')
            browser.close()
            return 1

        imported_avatar = page.url.split('/character/')[-1]
        print(f'   Imported character avatar: {imported_avatar}')

        page.screenshot(path='docs/images/character-import.png', full_page=False)

        # 5. Cleanup
        print('=> Deleting imported character')
        csrf_response = page.request.get(f'{BASE_URL}/csrf-token')
        csrf_token = csrf_response.json().get('token', '') if csrf_response.ok else ''
        response = page.request.post(
            f'{BASE_URL}/api/characters/delete',
            data={'avatar_url': imported_avatar if imported_avatar.endswith('.png') else f'{imported_avatar}.png'},
            headers={'X-CSRF-Token': csrf_token},
        )
        print(f'   Delete response: {response.status}')

        browser.close()

        if errors:
            print('[FAIL] Page errors detected:')
            for e in errors:
                print(f'  {e}')
            return 1

        print('[OK] Character import E2E passed')
        return 0


if __name__ == '__main__':
    sys.exit(run())
