var config = {
    main: {
        appVer: '1.0',
        // sigMethod: 'SHA256withRSA',
        sigMethod: {
            level1: 'HMACSHA256',
            level2: 'SHA256withRSA'
        },
        callerZone: ['WWW', 'Internet Zone', 'Intranet Zone', 'SGNet'],
        providerGateway: ['Internal Gateway', 'External Gateway'],
        authLevels: [0, 1, 2],
        defaultGateway: "apex_example_gateway",
        defaultAuthPrefix: "Apex",
        notificationShowTime : 5000,
        domain: ".api.gov.sg"
        ,
        errorMsgs :{
            noSelectedGateway: "Gateway must be specified",
            noAppId : "Application Id must be specified",
            noAppSecret: "Application Secret must be specified",
            timestampInvalid : "Timestamp must be specified if not autogenerated",
            nonceInvalid : "Nonce must be specified if not autogenerated",
            pemSecretInvalid : "Please verify that both pem string and secret are correct"
        }
    },
    sign: {
        beginPrivateRSA: "-----BEGIN RSA PRIVATE KEY-----",
        endPrivRSA: "-----END RSA PRIVATE KEY-----",
        beginCert: "-----BEGIN CERTIFICATE-----",
        endCert: "-----END CERTIFICATE-----"
    },
    test: {
        levels: [0, 1, 2]
    }
};

export default config;