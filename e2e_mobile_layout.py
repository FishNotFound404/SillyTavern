"""Mobile responsive layout E2E test."""

from playwright.sync_api import sync_playwright, Page, Route, expect
import sys
from pathlib import Path
import urllib.parse

BASE_URL = 'http://localhost:5173'
OUT_DIR = 'docs/images'
DATA_DIR = Path('C:/Users/muchj/Developer/refact/SillyTavern/data/default-user')


def mock_generate(route: Route) -> None:
    sse_body = (
        'data: {"choices":[{"delta":{"content":"Hi!"}}]}\n\n'
        'data: [DONE]\n\n'
    )
    route.fulfill(status=200, content_type='text/event-stream', body=sse_body)


def screenshot(page: Page, name: str) -> None:
    path = f'{OUT_DIR}/{name}.png'
    page.screenshot(path=path, full_page=False)
    print(f'[screenshot] {path}')


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 375, 'height': 812})

        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.route('**/api/backends/chat-completions/generate', mock_generate)

        def log_console(msg):
            if msg.type == 'error':
                print(f'[console {msg.type}] {msg.text}')

        page.on('console', log_console)

        # 1. Characters list
        print('=> Characters list on mobile')
        page.goto(f'{BASE_URL}/')
        page.wait_for_timeout(1500)
        screenshot(page, 'mobile-characters')

        # 2. Hamburger menu
        print('=> Opening hamburger menu')
        page.get_by_role('button', name='Toggle menu').click()
        page.wait_for_timeout(300)
        expect(page.locator('nav div.md\\:hidden a:text("Settings")').first).to_be_visible()
        screenshot(page, 'mobile-menu')
        # Close menu by clicking a link
        page.locator('nav div.md\\:hidden a:text("Characters")').first.click()
        page.wait_for_timeout(300)

        # 3. Character detail
        print('=> Character detail on mobile')
        page.goto(f'{BASE_URL}/character/default_Seraphina.png')
        page.wait_for_timeout(1500)
        screenshot(page, 'mobile-character-detail')

        # 4. Single chat
        print('=> Single chat on mobile')
        page.goto(f'{BASE_URL}/chat?avatar=default_Seraphina.png')
        page.wait_for_timeout(1500)
        page.locator('textarea[placeholder*="message"]').fill('Hello from mobile')
        page.get_by_role('button', name='Send').click()
        page.wait_for_timeout(1500)
        expect(page.locator('text=Hello from mobile').first).to_be_visible()
        screenshot(page, 'mobile-chat')

        # 5. Groups list and creation
        print('=> Groups list on mobile')
        page.goto(f'{BASE_URL}/groups')
        page.wait_for_timeout(1500)
        screenshot(page, 'mobile-groups')

        print('=> Creating a group on mobile')
        page.get_by_role('button', name='Create Group').click()
        page.wait_for_url('**/groups/new')
        page.locator('#group-name').fill('Mobile Group')
        member_buttons = page.locator('button[type="button"]').all()
        selectable = [b for b in member_buttons if b.locator('img').count() > 0]
        if len(selectable) >= 2:
            selectable[0].click()
            selectable[1].click()
        page.get_by_role('button', name='Create Group').click()
        page.wait_for_url('**/chat?group=**')
        page.wait_for_timeout(1000)
        expect(page.locator('text=Mobile Group').first).to_be_visible()

        # Toggle members sidebar
        print('=> Toggling members sidebar')
        member_toggle = page.get_by_role('button', name='Toggle members')
        if member_toggle.count() > 0:
            member_toggle.click()
            page.wait_for_timeout(300)
            expect(page.locator('aside h2:text("Members")').first).to_be_visible()
            screenshot(page, 'mobile-group-sidebar')
            page.get_by_role('button', name='Close members').click()
            page.wait_for_timeout(300)

        page.locator('textarea[placeholder*="group"]').fill('Mobile group hello')
        page.get_by_role('button', name='Send').click()
        page.wait_for_timeout(1500)
        expect(page.locator('text=Mobile group hello').first).to_be_visible()
        screenshot(page, 'mobile-group-chat')

        # Cleanup group
        parsed = urllib.parse.urlparse(page.url)
        group_id = urllib.parse.parse_qs(parsed.query).get('group', [''])[0]
        if group_id:
            meta_file = DATA_DIR / 'groups' / f'{group_id}.json'
            chat_file = DATA_DIR / 'group chats' / f'{group_id}.jsonl'
            try:
                meta_file.unlink(missing_ok=True)
                chat_file.unlink(missing_ok=True)
                print(f'[cleanup] {meta_file} and {chat_file}')
            except Exception as e:
                print(f'[cleanup warning] {e}')

        # 6. Settings
        print('=> Settings on mobile')
        page.goto(f'{BASE_URL}/settings')
        page.wait_for_timeout(1500)
        screenshot(page, 'mobile-settings')

        browser.close()

        if errors:
            print('[FAIL] Page errors detected:')
            for e in errors:
                print(f'  {e}')
            return 1

        print('[OK] Mobile layout E2E passed')
        return 0


if __name__ == '__main__':
    sys.exit(run())
