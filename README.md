A small package to work with Azure's storage container.
It allows to upload and delete files from blob or file shares containers.



## API


### `deployBlob`


Usually is used for deploying static files, such as FE part of the application.

```javascript
const { deployBlob } = require('azure-node-deploy');

deployBlob({
  connectionString, // string to connect to specific storage container
  storageName = '$web', // specific storageName
  from = './', // the path to the target folder we going to deploy from
});
```

### `deployShareFile`

Usually is used for deploying functions. To use it you need to create a specific storage during the function creation process.

```javascript
const { deployShareFile } = require('azure-node-deploy');

deployShareFile({
  connectionString, // string to connect to specific storage container
  storageName = null, // spicific storage name to deploy to. Keep null to auto getting storage name. Could be usefull if the storage's used only as function's files storage.
  from = './', // the path to the target folder we going to deploy from
  to = './site/wwwroot/', // the path to the target folder we going to deploy from
});
```
