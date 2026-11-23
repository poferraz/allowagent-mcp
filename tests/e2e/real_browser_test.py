"""Run npm run build, then run this test with Python Playwright installed."""

import json
import os
import re
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import quote

from playwright.sync_api import expect, sync_playwright


SETTINGS_KEY = 'allowagent_connection_settings'
CREDENTIALS = {
    'paypalClientId': 'fixture-client-id',
    'paypalClientSecret': 'fixture-client-secret',
    'aiApiKey': 'fixture-model-key',
}


@contextmanager
def serve_build():
    dist = Path(__file__).resolve().parents[2] / 'dist'
    if not (dist / 'index.html').is_file():
        raise RuntimeError('Build the application with npm run build before running this test.')
    with ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=dist)) as server:
        worker = Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            yield f'http://127.0.0.1:{server.server_port}'
        finally:
            server.shutdown()
            worker.join()


def assert_credentials_purged(page):
    purged = page.evaluate("""markers => {
        const values = [
            ...Object.values(localStorage), ...Object.values(sessionStorage),
            decodeURIComponent(document.cookie)
        ];
        return values.every(value => markers.every(marker => !value.includes(marker)));
    }""", list(CREDENTIALS.values()))
    assert purged, 'A synthetic credential was found in browser storage.'


def verify_demo(page):
    expect(page.locator('.demo-indicator')).to_contain_text('Demo account')
    proposal = page.locator('.agent-proposal-text strong')
    page.get_by_role('button', name="Pay Sarah's invoice $185").click()
    expect(proposal).to_contain_text('Sarah')

    page.get_by_role('button', name='Business', exact=True).click()
    page.get_by_role('button', name='Refund customer $24').click()
    expect(proposal).to_contain_text('ORD-772')

    # Exercise the input and verify that a new proposal, not the old card, appears.
    page.get_by_role('button', name='Personal', exact=True).click()
    page.locator('.agent-input').fill('pay cleaning invoice')
    page.get_by_role('button', name='Ask Assistant').click()
    expect(proposal).to_contain_text('Sarah')
    expect(page.locator('.review-pane .decision h3')).to_have_text('Needs your review')
    page.get_by_role('button', name=re.compile('A suspicious invoice')).click()
    expect(page.locator('.review-pane .decision h3')).to_contain_text('blocked')
    expect(page.locator('.account-strip')).to_contain_text('$42.00')


def verify_settings(page, origin):
    settings = page.get_by_role('button', name='Settings', exact=True)
    dialog = page.get_by_role('dialog')
    client_id = dialog.get_by_placeholder('e.g. A21AA...')
    client_secret = dialog.get_by_placeholder('e.g. E...')
    model_key = dialog.get_by_placeholder('sk-...')
    provider = dialog.get_by_role('combobox')

    settings.click()
    client_id.fill(CREDENTIALS['paypalClientId'])
    client_secret.fill(CREDENTIALS['paypalClientSecret'])
    provider.select_option('openai')
    model_key.fill(CREDENTIALS['aiApiKey'])
    dialog.get_by_role('button', name='Save & Apply').click()
    expect(dialog).to_be_hidden()
    settings.click()
    assert all([client_id.input_value() == CREDENTIALS['paypalClientId'],
                client_secret.input_value() == CREDENTIALS['paypalClientSecret'],
                model_key.input_value() == CREDENTIALS['aiApiKey']]), 'Current-tab credentials were lost.'
    assert_credentials_purged(page)
    page.reload()
    expect(page.locator('.demo-indicator')).to_contain_text('Demo account')
    settings.click()
    expect(provider).to_have_value('openai')
    for field in [client_id, client_secret, model_key]:
        expect(field).to_have_value('')
    dialog.get_by_role('button', name='Cancel').click()

    # Seed an older installation that saved connection settings in every tier.
    legacy = json.dumps(dict(CREDENTIALS, aiProvider='openai'))
    page.evaluate("""([key, value]) => {
        localStorage.setItem(key, value);
        sessionStorage.setItem(key, value);
    }""", [SETTINGS_KEY, legacy])
    page.context.add_cookies([{'name': SETTINGS_KEY, 'value': quote(legacy), 'url': origin}])
    page.reload()
    expect(page.locator('.demo-indicator')).to_contain_text('Demo account')
    assert_credentials_purged(page)
    settings.click()
    expect(provider).to_have_value('openai')
    for field in [client_id, client_secret, model_key]:
        expect(field).to_have_value('')


def run_browser_verification():
    with serve_build() as origin, sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel=os.environ.get('PLAYWRIGHT_CHROMIUM_CHANNEL'))
        context = browser.new_context(service_workers='block')
        external_requests = []

        def local_requests_only(route):
            if route.request.url.startswith(origin + '/'):
                route.continue_()
            else:
                external_requests.append(route.request.resource_type)
                route.abort()

        context.route('**/*', local_requests_only)
        try:
            page = context.new_page()
            page.goto(origin)
            expect(page).to_have_title(re.compile('AllowAgent'))
            verify_demo(page)
            verify_settings(page, origin)
            assert not external_requests, 'The test flow attempted an external network request.'
            print(f'Browser {browser.version}: demo, payment review, and credential privacy passed.')
        finally:
            context.close()
            browser.close()


if __name__ == '__main__':
    run_browser_verification()
