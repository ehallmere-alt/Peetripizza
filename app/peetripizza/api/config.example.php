<?php
// Copy to config.php only after you obtain a dedicated, approved API credential.
// Do not reuse a browser session ID, a screenshot token, or a customer's credential.
return [
    'base_url' => 'https://peetripizza.ee',
    'session_id' => getenv('PEETRI_API_SESSION') ?: '',
    'enabled' => false,
];
