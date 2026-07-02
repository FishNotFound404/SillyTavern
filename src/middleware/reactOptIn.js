import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { serverDirectory } from '../server-directory.js';

const COOKIE_NAME = 'st_use_legacy';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readCookieValue(cookieHeader) {
    if (!cookieHeader) return undefined;
    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const eq = part.indexOf('=');
        if (eq < 0) continue;
        const name = part.slice(0, eq).trim();
        if (name === COOKIE_NAME) {
            try {
                return decodeURIComponent(part.slice(eq + 1).trim());
            } catch {
                return undefined;
            }
        }
    }
    return undefined;
}

/**
 * Checks whether the current request has the legacy frontend opt-out cookie set.
 * @param {import('express').Request} request Express request object
 * @returns {boolean} True if the legacy frontend is opted-in for this request
 */
export function useLegacy(request) {
    return readCookieValue(request.headers.cookie) === '1';
}

/**
 * Express middleware that processes `?legacy=1` / `?legacy=0` query parameters
 * to set or clear the opt-out cookie, then redirects to the same path without
 * the query parameter so the URL stays clean.
 * @type {import('express').RequestHandler}
 */
export function legacyOptOutMiddleware(request, response, next) {
    const value = request.query.legacy;
    if (value === undefined) {
        return next();
    }

    if (value === '1') {
        response.append('Set-Cookie',
            `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax; HttpOnly`);
    } else if (value === '0') {
        response.append('Set-Cookie',
            `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`);
    }

    return response.redirect(302, request.path);
}

export const REACT_DIST_DIRECTORY = path.join(serverDirectory, 'frontend', 'dist');
export const REACT_INDEX_PATH = path.join(REACT_DIST_DIRECTORY, 'index.html');
const REACT_ASSETS_DIRECTORY = path.join(REACT_DIST_DIRECTORY, 'r-assets');

/**
 * Returns true when a pre-built React frontend dist exists on disk.
 * @returns {boolean}
 */
export function isReactDistAvailable() {
    try {
        return fs.statSync(REACT_INDEX_PATH).isFile();
    } catch {
        return false;
    }
}

/**
 * Returns an Express static middleware that serves the React assets directory
 * under `/r-assets`. Returns a no-op middleware if the directory is missing.
 * @returns {import('express').RequestHandler}
 */
export function getReactAssetsMiddleware() {
    if (!isReactAssetsAvailable()) {
        return (_req, _res, next) => next();
    }

    return express.static(REACT_ASSETS_DIRECTORY, {
        immutable: true,
        maxAge: '7d',
        fallthrough: true,
    });
}

/**
 * Returns an Express static middleware that serves the React dist root
 * (e.g. `favicon.svg`, `icons.svg`). Falls through when the file is missing
 * and does not auto-serve `index.html` so it does not interfere with the
 * explicit `/` route handler.
 * @returns {import('express').RequestHandler}
 */
export function getReactDistRootMiddleware() {
    if (!isReactDistAvailable()) {
        return (_req, _res, next) => next();
    }

    return express.static(REACT_DIST_DIRECTORY, {
        fallthrough: true,
        index: false,
        maxAge: '1d',
    });
}

function isReactAssetsAvailable() {
    try {
        return fs.statSync(REACT_ASSETS_DIRECTORY).isDirectory();
    } catch {
        return false;
    }
}
