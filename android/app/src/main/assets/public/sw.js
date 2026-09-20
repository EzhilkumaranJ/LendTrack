/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "index.html",
    "revision": "5a35b6fbb506b1fc7127170184445d4a"
  }, {
    "url": "assets/index-DhbI-y88.css",
    "revision": null
  }, {
    "url": "assets/index-C_c43M-p.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "765788164826b07bbea6debf1e6d82a7"
  }, {
    "url": "icon.svg",
    "revision": "860e19ae01a0514d04fb36e46154f9d9"
  }, {
    "url": "manifest.json",
    "revision": "bd697632726ccb00340b5bedcaa84a90"
  }, {
    "url": "manifest.webmanifest",
    "revision": "bd697632726ccb00340b5bedcaa84a90"
  }, {
    "url": "pwa-192x192.png",
    "revision": "950ea63f49f489ed1860973260c890ad"
  }, {
    "url": "pwa-512x512.png",
    "revision": "554e98f55dd00dcb453750fa8739a1bc"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "8403a9c1d42efa2d615c29035a36dd54"
  }, {
    "url": "screenshot-desktop.png",
    "revision": "dd8361c37ef0b184eeb09e2b2d080579"
  }, {
    "url": "screenshot-mobile.png",
    "revision": "ffd5a67849b66ed05b9625c877d9b548"
  }, {
    "url": "sw.js",
    "revision": "0c99d8b4fb16445445b1e5143ff276a8"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
