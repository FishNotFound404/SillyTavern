import { jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const fetchMock = jest.fn();
const readSecretMock = jest.fn();

jest.unstable_mockModule('node-fetch', () => ({
    default: fetchMock,
}));

jest.unstable_mockModule('../src/endpoints/secrets.js', () => ({
    readSecret: readSecretMock,
    SECRET_KEYS: { MINIMAX: 'api_key_minimax' },
}));

const { router } = await import('../src/endpoints/minimax.js');

describe('MiniMax endpoints', () => {
    /** @type {import('express').Express} */
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use((req, _res, next) => {
            req.user = { directories: { root: '/fake' } };
            next();
        });
        app.use('/api/minimax', router);
        fetchMock.mockReset();
        readSecretMock.mockReset();
    });

    describe('GET /api/minimax/status', () => {
        test('returns configured=false when API key is missing', async () => {
            readSecretMock.mockReturnValue(undefined);

            const response = await request(app).get('/api/minimax/status');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                configured: false,
                default_model: 'MiniMax-M3',
                available_models: ['MiniMax-M3', 'MiniMax-Text-01', 'abab6.5s-chat'],
            });
        });

        test('returns configured=true when API key is set', async () => {
            readSecretMock.mockReturnValue('fake-key');

            const response = await request(app).get('/api/minimax/status');

            expect(response.status).toBe(200);
            expect(response.body.configured).toBe(true);
        });
    });

    describe('POST /api/minimax/chat/generate', () => {
        test('returns 400 when API key is not configured', async () => {
            readSecretMock.mockReturnValue(undefined);

            const response = await request(app)
                .post('/api/minimax/chat/generate')
                .send({ messages: [{ role: 'user', content: 'Hi' }] });

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/not configured/i);
        });

        test('returns 400 when messages array is missing', async () => {
            readSecretMock.mockReturnValue('fake-key');

            const response = await request(app)
                .post('/api/minimax/chat/generate')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/messages/i);
        });

        test('proxies request to MiniMax and returns content', async () => {
            readSecretMock.mockReturnValue('fake-key');
            fetchMock.mockResolvedValue({
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'Hello!' } }],
                }),
            });

            const response = await request(app)
                .post('/api/minimax/chat/generate')
                .send({
                    messages: [{ role: 'user', content: 'Hi' }],
                    model: 'MiniMax-M3',
                    baseUrl: 'https://api.minimaxi.com/v1',
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ content: 'Hello!' });
            expect(fetchMock).toHaveBeenCalledTimes(1);
            const fetchCall = fetchMock.mock.calls[0];
            expect(fetchCall[0]).toBe('https://api.minimaxi.com/v1/chat/completions');
            expect(fetchCall[1].headers.Authorization).toBe('Bearer fake-key');
            expect(fetchCall[1].body).toContain('MiniMax-M3');
        });

        test('returns 500 when MiniMax API responds with an error', async () => {
            readSecretMock.mockReturnValue('fake-key');
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({
                    base_resp: { status_code: 1004, status_msg: 'Auth failed' },
                }),
            });

            const response = await request(app)
                .post('/api/minimax/chat/generate')
                .send({ messages: [{ role: 'user', content: 'Hi' }] });

            expect(response.status).toBe(500);
            expect(response.body.error).toMatch(/Authentication failed/i);
        });
    });
});
