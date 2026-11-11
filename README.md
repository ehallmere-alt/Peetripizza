# Peetri Pizza Service App

Кухонное приложение пиццерии (PHP + чистый JS + CSS). Интерфейс на эстонском. Работает на планшете Android (Chrome, горизонтально), сервер: crestudio.ee/peetripizza.

Текущая версия: **17.8.0**.

## Что где лежит

| Папка | Что внутри |
|---|---|
| `app/peetripizza/` | Само приложение, ровно то, что лежит на сервере |
| `tests/api/` | Проверка всех API против поддельного peetripizza.ee (`battery.py`, 71 проверка) |
| `tests/browser/` | Браузерные тесты на Playwright с поддельной сессией (18 тестов) |
| `tests/card/` | Скриншот карточек заказа с тестовыми LIVE-данными |
| `tools/` | Генератор SSH-патчей и манифеста версий |
| `patches/` | Готовые команды для установки через SSH |

## Как ставить обновление на сервер

Обновления ставятся одной командой в SSH: открыть нужный файл из `patches/`, скопировать целиком, вставить в терминал. Команда сама находит папку приложения, сверяет контрольные суммы, делает бэкап и откатывается, если что-то не так.

## Как проверить изменения локально

Нужны PHP 8.1+, Node.js и Playwright.

```bash
# API: поднимает копию app/ и поддельный peetripizza.ee на :8097/:8098
bash tests/api/setup.sh app/peetripizza && python3 tests/api/battery.py
rm -f /tmp/pp-login-*.json   # лимит входов между прогонами

# Браузер: копия app/ с поддельной сессией на :8099
bash tests/browser/serve.sh app/peetripizza &   # в отдельном терминале
node tests/browser/run-tests.js
```

## Как сделать новую версию

1. Ветка от `main`, правки в `app/peetripizza`.
2. Поднять версию: `<meta name="peetri-release">` в `dashboard.php`, `?v=` у изменённых файлов, подпись в меню, `tools/release-check.php`, `tools/v17-smoke-check.php`.
3. `python3 tools/gen_manifest.py app/peetripizza 17.9.0`
4. Pull request → слияние в `main`.

После слияния GitHub сам (workflow `.github/workflows/ssh-patch.yml`) соберёт `patches/update-<старая>-to-<новая>-ssh.txt` и `update-any-to-<новая>-ssh.txt`, проверит патч на копии старой версии, поставит тег `v<новая>` и создаст Release с файлами. Их и вставлять в SSH.

Вручную то же самое: `python3 tools/gen_patch.py <старая_папка> app/peetripizza 17.8.0 17.9.0 patches/update-17.8-to-17.9-ssh.txt <изменённые файлы>` (`tools/release-manifest.php` в список не передавать).

Правила проекта для людей и ИИ-помощников: [AGENTS.md](AGENTS.md).
