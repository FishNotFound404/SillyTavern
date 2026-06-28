"""E2E test for chat message search and highlight."""

from playwright.sync_api import sync_playwright, Page, Route, expect
import sys

BASE_URL = 'http://localhost:5173'


def mock_generate(route: Route) -> None:
    sse_body = (
        'data: {"choices":[{"delta":{"content":"I love apples!"}}]}\n\n'
        'data: [DONE]\n\n'
    )
    route.fulfill(status=200, content_type='text/event-stream', body=sse_body)


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
        page.route('**/api/backends/chat-completions/generate', mock_generate)

        print('=> Opening character')
        page.goto(f'{BASE_URL}/')
        page.wait_for_timeout(1500)
        page.locator('text=Seraphina').first.click()
        page.wait_for_timeout(1000)
        page.get_by_role('button', name='Start Chat').click()
        page.wait_for_timeout(1500)

        print('=> Sending messages')
        page.get_by_placeholder('Type a message...').fill('apple one')
        page.get_by_role('button', name='Send').click()
        page.get_by_role('button', name='Send').wait_for(state='visible', timeout=45000)
        page.wait_for_timeout(500)

        page.get_by_placeholder('Type a message...').fill('apple two')
        page.get_by_role('button', name='Send').click()
        page.get_by_role('button', name='Send').wait_for(state='visible', timeout=45000)
        page.wait_for_timeout(500)

        print('=> Searching')
        search_input = page.get_by_placeholder('Search messages...')
        search_input.fill('apple')
        page.wait_for_timeout(500)

        marks = page.locator('mark')
        mark_count = marks.count()
        print(f'   Highlighted marks: {mark_count}')
        if mark_count < 2:
            print('[FAIL] Expected at least 2 highlighted matches')
            browser.close()
            return 1

        page.screenshot(path='docs/images/chat-search.png', full_page=False)
        print('[screenshot] docs/images/chat-search.png')

        browser.close()

        if errors:
            print('Page errors:', errors)
            return 1
        return 0


if __name__ == '__main__':
    sys.exit(run())
