# Get all your data from Indy

Because Indy is not a great service, you may need to export all your data manually.
The customer service does not accept to do it, but after paying months and months, I needed all my data to migrate to another tool.

# How to use ?

#### Clone

First, clone this repository
```bash
git clone https://github.com/zouloux/indy-export.git
cd indy-export
```

#### Extract your authorization token
This token is needed so this script will be able to get data from your account.

To get it:
- Browse to https://app.indy.fr and log in
- Open dev console
- Go to network tab
- Refresh page
- Check any 'fetch/xhr' request to their api
- Get to the Headers and look for `Authorization`, it starts with `Bearer ...`
- Remove the `Bearer` part and save it somewhere.

#### Dot env

You can create a `.env` file with your token, otherwise the script will ask for it :
```dotenv
INDY_AUTHORIZATION_BEARER=...
```

#### Start script

Start script using [Bun](https://bun.sh/) :
```shell
bun index.ts
```

#### Data

Raw data will be found in `./data` directory. No data are modified by this script or used for something else.

Here is the file structure :
```
- receipts/
  - {id}/
    - receipt.json
    - receipt.(pdf|jpg|png)
- transaction-objects/
  - transaction-{id}.json 
- transaction-pages/
  - page-{page}.json
```


