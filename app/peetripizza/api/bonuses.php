<?php
// Safe shutdown of retired employee-bonus API; never touches historical server data.
declare(strict_types=1);
http_response_code(410);
header('Cache-Control: no-store');
header('Content-Type: application/json; charset=utf-8');
echo '{"ok":false,"error":"retired_employee_bonus_module"}';
