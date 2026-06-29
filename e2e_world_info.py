"""Quick E2E test for World Info pages."""

from playwright.sync_api import sync_playwright
import sys

BASE_URL = 'http://localhost:5173'
OUT_DIR = 'docs/images'


def run() -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        def log_console(msg):
            if msg.type == 'error':
                print(f'[console {msg.type}] {msg.text}')
        page.on('console', log_console)

        # Create a unique world info name to avoid collisions
        import uuid
        world_name = f'E2E-{uuid.uuid4().hex[:8]}'

        print('=> Loading world info list')
        page.goto(f'{BASE_URL}/world-info')
        page.wait_for_timeout(2500)
        page.screenshot(path=f'{OUT_DIR}/world-info-list.png', full_page=False)

        print(f'=> Creating {world_name}')
        def handle_dialog(dialog):
            if dialog.type == 'prompt':
                dialog.accept(world_name)
            else:
                dialog.accept()
        page.on('dialog', handle_dialog)
        page.get_by_role('button', name='New World Info').click()
        page.wait_for_timeout(1500)
        print('   Current URL:', page.url)
        if f'/world-info/{world_name}' not in page.url:
            print('[FAIL] Navigation to editor failed')
            browser.close()
            return 1
        page.screenshot(path=f'{OUT_DIR}/world-info-edit-empty.png', full_page=False)

        print('=> Adding entry')
        page.get_by_role('button', name='Add Entry').click()
        page.wait_for_timeout(500)
        page.screenshot(path=f'{OUT_DIR}/world-info-entry-expanded.png', full_page=False)

        print('=> Filling entry fields')
        page.get_by_label('Comment / Label').fill('Magic system')
        page.get_by_label('Primary Keywords').fill('magic\nspell')
        page.get_by_label('Content to Inject').fill('Magic is woven from ambient mana.')
        # Test collapse / expand
        page.get_by_role('button', name='Collapse').click()
        page.wait_for_timeout(300)
        page.screenshot(path=f'{OUT_DIR}/world-info-entry-collapsed.png', full_page=False)
        page.get_by_role('button', name='Expand').click()
        page.wait_for_timeout(300)

        print('=> Saving')
        page.get_by_role('button', name='Save').click()
        page.wait_for_timeout(1500)
        page.screenshot(path=f'{OUT_DIR}/world-info-saved.png', full_page=False)

        print('=> Reloading to verify persistence')
        page.reload()
        page.wait_for_timeout(2500)
        page.screenshot(path=f'{OUT_DIR}/world-info-reloaded.png', full_page=False)

        print('=> Expanding entry after reload')
        page.get_by_role('button', name='Expand').click()
        page.wait_for_timeout(500)

        # Verify the entry is still there and fields persisted
        comment = page.get_by_label('Comment / Label').input_value()
        keywords = page.get_by_label('Primary Keywords').input_value()
        content = page.get_by_label('Content to Inject').input_value()
        print(f'   Loaded comment={comment!r} keywords={keywords!r} content={content!r}')

        if comment != 'Magic system' or 'magic' not in keywords or content != 'Magic is woven from ambient mana.':
            print('[FAIL] Persistence verification failed')
            browser.close()
            return 1

        print('=> Cleanup: deleting world info')
        page.goto(f'{BASE_URL}/world-info')
        page.wait_for_timeout(1500)
        # Find the card for our world and click its delete button
        card = page.locator(f'text={world_name}').first.locator('xpath=ancestor::div[contains(@class,"bg-gray-900")]')
        delete_btn = card.get_by_role('button', name='Delete')
        if delete_btn.count() == 0:
            # Fallback: look for any delete button in the card
            delete_btn = card.locator('button[title="Delete"]')
        delete_btn.click()
        page.wait_for_timeout(1000)
        page.screenshot(path=f'{OUT_DIR}/world-info-deleted.png', full_page=False)

        browser.close()
        print('[PASS] World Info E2E test completed')
        return 0


if __name__ == '__main__':
    sys.exit(run())
