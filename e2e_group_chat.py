"""E2E smoke test for group chat creation and messaging."""

from playwright.sync_api import sync_playwright, Page, Route, expect
import sys
from pathlib import Path
import urllib.parse

BASE_URL = 'http://localhost:5173'
DATA_DIR = Path('C:/Users/muchj/Developer/refact/SillyTavern/data/default-user')


def mock_generate(route: Route) -> None:
    sse_body = (
        'data: {"choices":[{"delta":{"content":"Hello!"}}]}\n\n'
        'data: {"choices":[{"delta":{"content":" This is"}}]}\n\n'
        'data: {"choices":[{"delta":{"content":" a group"}}]}\n\n'
        'data: {"choices":[{"delta":{"content":" reply."}}]}\n\n'
        'data: [DONE]\n\n'
    )
    route.fulfill(status=200, content_type='text/event-stream', body=sse_body)


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.route('**/api/backends/chat-completions/generate', mock_generate)

        def log_console(msg):
            if msg.type == 'error':
                print(f'[console {msg.type}] {msg.text}')

        page.on('console', log_console)

        # 1. Groups list
        print('=> Loading groups list')
        page.goto(f'{BASE_URL}/groups')
        page.wait_for_timeout(1500)
        expect(page.get_by_role('heading', name='Groups', exact=True)).to_be_visible()
        page.get_by_role('button', name='Create Group').click()

        # 2. Create group form
        print('=> Filling create group form')
        page.wait_for_url('**/groups/new')
        page.locator('#group-name').fill('Test Group')

        # Select first two member buttons
        member_buttons = page.locator('button[type="button"]').all()
        selectable = [b for b in member_buttons if b.locator('img').count() > 0]
        if len(selectable) < 2:
            print('Not enough characters to form a group')
            return 1
        selectable[0].click()
        selectable[1].click()

        page.get_by_role('button', name='Create Group').click()

        # 3. Group chat page
        print('=> Waiting for group chat')
        page.wait_for_url('**/chat?group=**')
        page.wait_for_timeout(1000)
        expect(page.locator('text=Test Group').first).to_be_visible()

        # 4. Send a message
        print('=> Sending a message')
        page.locator('textarea[placeholder*="group"]').fill('Hey everyone!')
        page.get_by_role('button', name='Send').click()

        page.wait_for_timeout(2000)
        expect(page.locator('text=Hey everyone!').first).to_be_visible()
        expect(page.locator('text=a group reply.').first).to_be_visible(timeout=10000)

        # 5. Trigger manual member reply
        print('=> Triggering manual member reply')
        member_button = page.locator('aside .space-y-2 button').first
        if member_button.count() > 0:
            member_button.click()
            page.wait_for_timeout(2000)
            expect(page.locator('text=group reply.').first).to_be_visible()

        page.screenshot(path='docs/images/group_chat.png', full_page=False)
        print('[screenshot] docs/images/group_chat.png')

        # 6. Clean up the test group
        print('=> Deleting test group')
        group_url = page.url
        parsed = urllib.parse.urlparse(group_url)
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

        browser.close()

        if errors:
            print('Page errors:', errors)
            return 1
        return 0


if __name__ == '__main__':
    sys.exit(run())
