"""E2E smoke test + screenshot capture for the React frontend refactor."""

from playwright.sync_api import sync_playwright, Page, expect
import sys

BASE_URL = 'http://localhost:5173'
AVATAR = 'default_Seraphina.png'
OUT_DIR = 'docs/images'


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
        page.on('console', lambda msg: print(f'[console {msg.type}] {msg.text}') if msg.type == 'error' else None)

        # 1. Characters list
        print('=> Loading characters list')
        page.goto(f'{BASE_URL}/')
        page.wait_for_timeout(2500)
        expect(page.get_by_role('heading', name='Characters')).to_be_visible()
        expect(page.locator('text=Seraphina').first).to_be_visible()
        expect(page.locator('text=Assistant').first).to_be_visible()
        screenshot(page, 'characters')

        # 2. Character detail
        print('=> Opening character detail')
        page.locator('text=Seraphina').first.click()
        page.wait_for_timeout(1200)
        expect(page.get_by_role('button', name='Start Chat')).to_be_visible()
        screenshot(page, 'character-detail')

        # 3. Start chat and create a fresh chat for the screenshot
        print('=> Starting chat')
        page.get_by_role('button', name='Start Chat').click()
        page.wait_for_timeout(2000)
        expect(page.locator('text=Seraphina').first).to_be_visible()
        screenshot(page, 'chat-empty')

        page.get_by_role('button', name='New Chat').click()
        page.wait_for_timeout(1500)

        # 4. Send a message and wait for the reply to finish
        print('=> Sending message')
        page.get_by_placeholder('Type a message...').fill('Hi Seraphina!')
        page.get_by_role('button', name='Send').click()
        page.get_by_role('button', name='Send').wait_for(state='visible', timeout=45000)
        page.wait_for_timeout(500)

        message_count = page.locator('.whitespace-pre-wrap').count()
        print(f'   Messages after send: {message_count}')
        if message_count < 2:
            print('[FAIL] Expected at least user + assistant messages')
            browser.close()
            return 1

        # Scroll to the user message so both it and the reply are visible
        user_msg = page.locator('.whitespace-pre-wrap').nth(1)
        user_msg.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        screenshot(page, 'chat')

        # 5. New chat
        print('=> Creating new chat')
        page.get_by_role('button', name='New Chat').click()
        page.wait_for_timeout(1500)
        message_count = page.locator('.whitespace-pre-wrap').count()
        print(f'   Messages after new chat: {message_count}')
        screenshot(page, 'new-chat')

        # 6. Send a message in the new chat, then reload to verify persistence
        print('=> Sending message in new chat')
        page.get_by_placeholder('Type a message...').fill('Nice to meet you!')
        page.get_by_role('button', name='Send').click()
        page.get_by_role('button', name='Send').wait_for(state='visible', timeout=45000)
        page.wait_for_timeout(500)
        message_count = page.locator('.whitespace-pre-wrap').count()
        print(f'   Messages after send: {message_count}')

        print('=> Reloading to verify persistence')
        page.reload()
        page.wait_for_timeout(3000)
        persisted = page.locator('.whitespace-pre-wrap').count()
        print(f'   Messages after reload: {persisted}')
        if persisted < 2:
            print('[FAIL] Chat did not persist after reload')
            browser.close()
            return 1

        browser.close()

        if errors:
            print('[FAIL] Page errors detected:')
            for e in errors:
                print(f'  {e}')
            return 1

        print('[OK] E2E smoke test passed')
        return 0


if __name__ == '__main__':
    sys.exit(run())
