"""E2E test for message swiping / branching in single-character chat."""

from playwright.sync_api import sync_playwright, Route, expect
import sys

BASE_URL = 'http://localhost:5173'


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))

        call_count = [0]

        def mock_generate(route: Route) -> None:
            call_count[0] += 1
            text = 'Original reply.' if call_count[0] == 1 else 'Alternative reply.'
            sse_body = (
                'data: {"choices":[{"delta":{"content":"%s"}}]}\n\n'
                'data: [DONE]\n\n'
            ) % text
            route.fulfill(status=200, content_type='text/event-stream', body=sse_body)

        page.route('**/api/backends/chat-completions/generate', mock_generate)

        def log_console(msg):
            if msg.type == 'error':
                print(f'[console {msg.type}] {msg.text}')

        page.on('console', log_console)

        print('=> Opening chat')
        page.goto(f'{BASE_URL}/chat?avatar=default_Seraphina.png')
        page.wait_for_timeout(1500)

        print('=> Starting a new chat')
        page.get_by_role('button', name='New Chat').click()
        page.wait_for_timeout(1000)

        print('=> Sending user message')
        page.locator('textarea[placeholder*="message"]').fill('Hello')
        page.get_by_role('button', name='Send').click()

        print('=> Waiting for first reply')
        expect(page.locator('text=Original reply.').last).to_be_visible(timeout=10000)
        page.screenshot(path='docs/images/chat-swipe-before.png', full_page=False)

        print('=> Regenerating last reply')
        page.locator('button[title="Regenerate"]').last.click(force=True)
        page.wait_for_timeout(2000)

        print('=> Checking second swipe')
        expect(page.locator('text=Alternative reply.').last).to_be_visible(timeout=10000)
        expect(page.locator('select:has-text("2/2")').last).to_be_visible()
        page.screenshot(path='docs/images/chat-swipe-alt.png', full_page=False)

        print('=> Switching to previous swipe')
        page.get_by_role('button', name='Previous swipe').last.click()
        page.wait_for_timeout(500)
        expect(page.locator('text=Original reply.').last).to_be_visible()
        expect(page.locator('select:has-text("1/2")').last).to_be_visible()

        print('=> Switching back to next swipe')
        page.get_by_role('button', name='Next swipe').last.click()
        page.wait_for_timeout(500)
        expect(page.locator('text=Alternative reply.').last).to_be_visible()
        expect(page.locator('select:has-text("2/2")').last).to_be_visible()

        page.screenshot(path='docs/images/chat-swipes.png', full_page=False)

        browser.close()

        if errors:
            print('[FAIL] Page errors detected:')
            for e in errors:
                print(f'  {e}')
            return 1

        print('[OK] Chat swipe E2E passed')
        return 0


if __name__ == '__main__':
    sys.exit(run())
