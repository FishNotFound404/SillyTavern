"""E2E test for character export."""

from playwright.sync_api import sync_playwright, Page
import sys
import os

BASE_URL = 'http://localhost:5173'
AVATAR = 'default_Seraphina.png'


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(accept_downloads=True, viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))

        def log_console(msg):
            if msg.type == 'error':
                print(f'[console {msg.type}] {msg.text}')

        page.on('console', log_console)

        print('=> Opening character detail')
        page.goto(f'{BASE_URL}/character/{AVATAR}')
        page.wait_for_timeout(1500)

        # Export PNG
        print('=> Exporting PNG')
        with page.expect_download() as download_info:
            page.get_by_role('button', name='Export PNG').click()
        download = download_info.value
        png_path = f'docs/images/character-export.png'
        download.save_as(png_path)
        print(f'   PNG saved: {png_path} ({os.path.getsize(png_path)} bytes)')

        # Export JSON
        print('=> Exporting JSON')
        with page.expect_download() as download_info:
            page.get_by_role('button', name='Export JSON').click()
        download = download_info.value
        json_path = f'docs/images/character-export.json'
        download.save_as(json_path)
        print(f'   JSON saved: {json_path} ({os.path.getsize(json_path)} bytes)')

        page.screenshot(path='docs/images/character-detail-export.png', full_page=False)

        browser.close()

        if errors:
            print('[FAIL] Page errors detected:')
            for e in errors:
                print(f'  {e}')
            return 1

        print('[OK] Character export E2E passed')
        return 0


if __name__ == '__main__':
    sys.exit(run())
