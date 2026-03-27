<?php

$itm_name = $_POST['sname'];
$itm_email = $_POST['semail'];
$itm_subject = $_POST['ssubject'];
$itm_message = $_POST['smessage'];

$server = "localhost";
$username = "mshayan_mscontact_db";
$password = "@Shayan@786";
$db = "mshayan_mscontact_db";

$con = mysqli_connect($server, $username, $password, $db);

    $query = "INSERT INTO contact_form(name,email,subject,message) VALUES ('{$itm_name}','{$itm_email}','{$itm_subject}','{$itm_message}')";
    $result = mysqli_query($con, $query);
    $done = header("Location: ../index.html");

    mysqli_close($con);

// $message = '<html><body><h1>HTML Email Example</h1><p>This is a sample HTML email.</p></body></html>';
// $headers = 'MIME-Version: 1.0' . "\r\n";
// $headers .= 'Content-type: text/html; charset=UTF-8' . "\r\n";

// Send the email
//if (mail($itm_email, $itm_subject, $message, $headers)) {
  //  echo 'Success! Email sent.';
//} else {
 //   echo 'Error sending email.';
//}
?>