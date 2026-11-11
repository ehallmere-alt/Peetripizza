<?php
// CLI only: php setup_staff.php USERNAME (password is prompted securely)
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {http_response_code(404);exit;}
require __DIR__.'/auth/bootstrap.php';
$name=$argv[1]??'';
if (!preg_match('/^[A-Za-z0-9_-]{3,40}$/D',$name)) {fwrite(STDERR,"Usage: php setup_staff.php USERNAME\n");exit(1);}
if (!function_exists('shell_exec')) {fwrite(STDERR,"Requires interactive terminal.\n");exit(1);}
fwrite(STDOUT,"Enter a NEW password (hidden): ");
$pw=rtrim((string)shell_exec('stty -echo; head -n 1 /dev/tty; stty echo'),"\r\n");
if (strlen($pw)<12 || strlen($pw)>256) {fwrite(STDERR,"Password must be 12-256 characters.\n");exit(1);}
$file=pp_credentials_file();
$users=pp_credentials();
$users[$name]=password_hash($pw,PASSWORD_DEFAULT);
$serialized="<?php\nreturn ".var_export($users,true).";\n";
if (file_put_contents($file,$serialized,LOCK_EX)===false) {fwrite(STDERR,"Cannot write credentials file: $file\n");exit(1);}
chmod($file,0600);
fwrite(STDOUT,"Staff account configured. Credentials file is outside public web root.\n");
