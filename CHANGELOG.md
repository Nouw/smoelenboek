## [1.0.3](https://github.com/Nouw/smoelenboek/compare/v1.0.2...v1.0.3) (2026-08-10)


### Bug Fixes

* **ci:** normalize GHCR image owner ([3508193](https://github.com/Nouw/smoelenboek/commit/3508193f252cc4b95b14e391d3834e2a45a90354))

## [1.0.2](https://github.com/Nouw/smoelenboek/compare/v1.0.1...v1.0.2) (2026-08-10)


### Bug Fixes

* **ci:** unblock release deployment ([40c76bf](https://github.com/Nouw/smoelenboek/commit/40c76bfd64e7d875dcfa492b6adf00352a7b730b))

## [1.0.1](https://github.com/Nouw/smoelenboek/compare/v1.0.0...v1.0.1) (2026-08-10)


### Bug Fixes

* removed consteraint from unit test ([9b03b7a](https://github.com/Nouw/smoelenboek/commit/9b03b7aab6967e00eeea8d859450d2b370810850))

# 1.0.0 (2026-08-10)


* feat(rpc)!: compute association seasons ([41b1389](https://github.com/Nouw/smoelenboek/commit/41b1389bbd1d53136b4194447e123a2221b446de))


### Bug Fixes

* **auth:** inherit API key owner role ([e492efd](https://github.com/Nouw/smoelenboek/commit/e492efdeba6c96866b871267f7ac413dc1945baf))
* **auth:** migrate reset sentinel users ([dc72b75](https://github.com/Nouw/smoelenboek/commit/dc72b75a370205f9b95527d7faa338c3a5392cbd))
* derive membership start from user creation ([c5d1400](https://github.com/Nouw/smoelenboek/commit/c5d14002521cdd0b254968a9f9f4ac7040b457e4))
* editing of users and added languages ([518f469](https://github.com/Nouw/smoelenboek/commit/518f4696dc0fb96595b62191c153ba686c6f13eb))
* keep search results clickable ([ddf00fa](https://github.com/Nouw/smoelenboek/commit/ddf00fa556983258b36589de57808eb94a98551c))
* make cold pnpm installs deterministic ([c400a92](https://github.com/Nouw/smoelenboek/commit/c400a9202afdf11c3702fd8fad52e50dd814f434))
* **protototo:** clarify inactive round state ([2b0038e](https://github.com/Nouw/smoelenboek/commit/2b0038ead15942a6fe601cdac21adbedf98f6424))
* **protototo:** document endpoint access ([029e952](https://github.com/Nouw/smoelenboek/commit/029e95241335bde6755457b9c074f9f127baeab7))
* **teams:** remove members immediately ([1fc7135](https://github.com/Nouw/smoelenboek/commit/1fc713567f582e367e12626144ba9e576dd7d2c3))
* **teams:** resolve legacy users by email ([6309a26](https://github.com/Nouw/smoelenboek/commit/6309a268a1e4d2a110a6f7cef0e661d1a49dd5ce))
* unwrap PostgreSQL outbox claims ([5cb5d10](https://github.com/Nouw/smoelenboek/commit/5cb5d109c6de01d4d4f6f5c2502d77fda5cedda6))
* **users:** normalize missing bond numbers ([211bf9c](https://github.com/Nouw/smoelenboek/commit/211bf9c896f08886434d390633dff3a251b9d26b))
* **web:** contain translated profile actions ([077c9ab](https://github.com/Nouw/smoelenboek/commit/077c9ab7889016669f16c1d7060caabeed3842d9))


### Features

* add member polls ([9d35b2b](https://github.com/Nouw/smoelenboek/commit/9d35b2b107c2fbe012b632fd4ac541741ba15cec))
* add protected member search ([f308a16](https://github.com/Nouw/smoelenboek/commit/f308a1663d28dbbb1b4783963cd2b26e7a3c6344))
* add Sponsorhengel page with PDF viewer and admin upload ([bf13dc8](https://github.com/Nouw/smoelenboek/commit/bf13dc8e27c5263dbc66a1c47e32573f3bc9404b))
* add user imports and email outbox ([edd93f3](https://github.com/Nouw/smoelenboek/commit/edd93f33bc6b47a271c9782f0a10c77b965c2546))
* add versioning and Proxmox deploy via GitHub Actions ([f44419d](https://github.com/Nouw/smoelenboek/commit/f44419d5c7a5d8823f56e8407e64dd96b91bb11b))
* added sending of mails on user information update ([a80cf45](https://github.com/Nouw/smoelenboek/commit/a80cf4548906e7d649a8b33e5fe5d58f155b58cd))
* **auth:** migrate legacy credentials ([562cf92](https://github.com/Nouw/smoelenboek/commit/562cf92df0b3ca810caed6dda4a7a9b1231f1a30))
* **committees:** add list and roster pages ([3ed607e](https://github.com/Nouw/smoelenboek/commit/3ed607e7a7102ccfdf90ab1a00c0abeeb0428e55))
* **committees:** add management workspace ([c793873](https://github.com/Nouw/smoelenboek/commit/c793873c44eaaf6b044994a789a188b44ebe4315))
* **committees:** migrate legacy memberships ([b9ad174](https://github.com/Nouw/smoelenboek/commit/b9ad1740bb112f792dd2deb7d148cad914b13ea9))
* **documents:** add season-based collections ([04eebb7](https://github.com/Nouw/smoelenboek/commit/04eebb7b06ca05b603e0797976c783b71075d990))
* **email:** dynamic multi-format template registry with typed enqueue inputs ([1ea6cde](https://github.com/Nouw/smoelenboek/commit/1ea6cdef472593893afef98e20fa2e66d603d1f8))
* **protototo:** add full betting workflow ([fd7abf0](https://github.com/Nouw/smoelenboek/commit/fd7abf04ea0f4bfbc39f40590c4de94a8feeb01d))
* **protototo:** split admin round flow ([520ce54](https://github.com/Nouw/smoelenboek/commit/520ce5408ae9a4abd9c11ced5198847e75048845))
* **rpc:** add user information records ([2dd30e5](https://github.com/Nouw/smoelenboek/commit/2dd30e5ede07c78e790a85f432a89c94bcd324b0))
* some fixes ([5e1cc02](https://github.com/Nouw/smoelenboek/commit/5e1cc02d0affeefae9e610fb0664542d32aa98d2))
* **teams:** add admin roster management ([6c92d68](https://github.com/Nouw/smoelenboek/commit/6c92d68d0898cfac01a1fa2b857fcdbe8d079743))
* **teams:** add current-season roster pages ([cf312e0](https://github.com/Nouw/smoelenboek/commit/cf312e02775b108620bb706d4ab70d0c3f407ca6))
* **teams:** migrate legacy memberships ([be36a21](https://github.com/Nouw/smoelenboek/commit/be36a2107038b51a5d80d9625cbd8b642a5cbfe8))
* **users:** edit member information ([9cb8525](https://github.com/Nouw/smoelenboek/commit/9cb8525955dfa4163b34cffd26ecc226ea7dee37))
* **users:** route profiles by user ID ([1f79ca0](https://github.com/Nouw/smoelenboek/commit/1f79ca0fc32ecc8a2027c4fcdf012a70398c97c0))
* **web:** add member profile page ([9b223ff](https://github.com/Nouw/smoelenboek/commit/9b223ff8c953bfce6c5dbdf12005d4521c9bb4ad))


### BREAKING CHANGES

* season IDs and season mutation endpoints are removed. Run the one-way season-key migration before restarting RPC.
