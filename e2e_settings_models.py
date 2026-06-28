"""E2E test for the Settings model auto-fetch dropdown."""

from playwright.sync_api import sync_playwright, Page, Route, expect
import sys

BASE_URL = 'http://localhost:5173'


def handle_route(route: Route) -> None:
    url = route.request.url
    if url.endswith('/api/settings/get'):
        route.fulfill(
            status=200,
            content_type='application/json',
            body='{"settings": "{\\"reactConnection\\":{\\"provider\\":\\"openai\\",\\"model\\":\\"gpt-4o-mini\\",\\"temperature\\":0.7,\\"maxTokens\\":1024,\\"stream\\":true,\\"minimaxEndpoint\\":\\"cn\\"}}"}',
        )
    elif url.endswith('/api/secrets/read'):
        route.fulfill(
            status=200,
            content_type='application/json',
            body='{"api_key_openai": [{"id": "1", "value": "sk-***", "label": "React UI", "active": true}]}',
        )
    elif url.endswith('/api/secrets/write'):
        route.fulfill(status=200, content_type='application/json', body='{}')
    elif url.endswith('/api/backends/chat-completions/status'):
        route.fulfill(
            status=200,
            content_type='application/json',
            body='{"data": [{"id": "gpt-4o-mini"}, {"id": "gpt-4o"}, {"id": "gpt-4-turbo"}]}',
        )
    elif url.endswith('/api/minimax/status'):
        route.fulfill(
            status=200,
            content_type='application/json',
            body='{"configured": true, "default_model": "MiniMax-M3", "available_models": ["MiniMax-M3", "MiniMax-Text-01"]}',
        )
    else:
        route.continue_()


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
        page.route('**/*', handle_route)

        print('=> Loading settings')
        page.goto(f'{BASE_URL}/settings')
        page.wait_for_selector('select#model', timeout=10000)

        print('=> Checking model dropdown')
        model_select = page.locator('select#model')
        expect(model_select).to_be_visible()
        options = model_select.locator('option').all_inner_texts()
        print('Options:', options)
        assert 'gpt-4o-mini' in options
        assert 'gpt-4o' in options

        page.screenshot(path='docs/images/settings-models.png', full_page=False)
        print('[screenshot] docs/images/settings-models.png')

        browser.close()

        if errors:
            print('Page errors:', errors)
            return 1
        return 0


if __name__ == '__main__':
    sys.exit(run())
