const { Storage } = require('@google-cloud/storage');

const keyFilePath = process.env.GCP_KEY_FILE_PATH;

module.exports = new Storage({
  credentials: {
    "type": "service_account",
    "project_id": "platinum-tube-414409",
    "private_key_id": "861b35708baa366b99cf33e82dbf72428acab936",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDVgrczUmpBLGwL\nNV2PJP6CgMO4ZowQX2/EYfAc6JeB2zvBNoSXYomXb6BWn+wbF2gCvvBcFc6D9pw/\n4BkucoY5w+bniKJ0yr/SCQvunPFJBQf86e4NpvjYu5nQmVtO7zBBuxWcZi2tq2MG\nnnOQDM2VNC8iAJ53aVn8BeRX9+CI2Tg82RGUbdCv9wigy/LErdovuiBbnLbrAhV+\nNRO168XXw+lBsk0s4kLbpzIJmDDavIJwpzhmmGIz+KQRx3rI/HYYn8X2RB7+KSWp\nKrhtKpwcgrLLYsbhTdXiB3/pprYvuO+hclmKoptr5RPRSum76JQIofAZ3MyOFb28\nd3vYODo3AgMBAAECggEAD0uxAi06TXb4OolVLYcR8Jl27AP0rsuXfzMg94E2MWha\nTIoyT4IQp1eo3evRB1PS8LdrEr3BMLT/FphgVXKA6Sx+o0GnmcRYn5xkTXDS3E9O\n9jBwDGxU0XoHF+mUoAAErgDQGIc9aH6ptnSthLlWFQVLBx2SPK3Ac4ycgizQ2hzM\nEEtXLNApvHCK0SBUIrZwIusUrGEnqq4xiQyZGVN1TbqkhobpYPA6u7UR1sctjEFL\nyYmR+SZIS+OiDY3h/jsuUqK7gAUMqOQMPHTsDltnMe1TqtzLtxNvN/bWJ54JvcRG\n6MvP5YE3E0mh6AMVTrUH6fxL6/9PUVVG1vPHc6IteQKBgQD8rMOESwJAhbfaUgMb\nOHKlWByNuSbVeIyaLkDx+l7HQSQMTDZwzJUZNwM31JaDxxR0i+kQcxdQQRjYOEA9\nlO4NcoONnJHjNJsAVKpBmEme8SoiSepXjC7u3KDbHmMOwZLhW8D/odI1RNeYwLW3\nULRPTWEqt51hjO0blanQcFkoewKBgQDYUgLu01pNjkl46uKCbif3iRYLDsI28/dL\n6nkq17Xazx3N9HqAudrI6tOMgkTjlErCAJYNMbRa1zu6/a69myfXnpUmznYN4S5W\nKG+kZnBA32rMXXU9qo4QqERzCpzyvc9uc8hSzcNV7k6TBWfQVnc/RyfNmef+2B9o\nuR4gxyYOdQKBgQCPNvUS1NkP7TrKGdX85b/Fi+2TPrCOKme3NCRHgxuZYIioF8J7\nqNmRkybVzD8Lrhkf/fU6B6HdMSh91VREE1fic1exOl9OIpEAXPyrdT+1QQgaqz6S\nJLitVowt5klLIdi4tyLrQbM90ilJQWE96BZrJHbAmZYwpon2Kpw3spY2ZQKBgGuZ\nx7mySe3gA+3wsED+uESp3NwdOEALdIw/kovcBqpTcdjbbgAP8qMUI6x1s/yb69+6\nWOkxOywgeaaWv0+zGMtpJ3nJIvHee6UBsh7NkbLDLyV+q23EI6xndrzen5kjD0Y6\ns390uGBLDKyW+L+p8uD37PWZQ8wBBwaZZkIZrXVtAoGBAPnVLN9lBprs4zFxUHkz\nQboZViBTVrmxW8EbYoBbDxiVZNhiogtYiQW4JjHzNthHaLyONJMsKsHA/HhgG4Zd\n6UAnl+YXorCfMPA5EXytaqi6vAYYujR0WJc83+wVT+m4C8s13OhgMjV7kqtX+QPo\ndnEK+Z1zy+VcAh256IvYQeh4\n-----END PRIVATE KEY-----\n",
    "client_email": "beavertail-testing@platinum-tube-414409.iam.gserviceaccount.com",
    "client_id": "108397571209979933452",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/beavertail-testing%40platinum-tube-414409.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  }
});