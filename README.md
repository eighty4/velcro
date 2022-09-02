# Velcro for Elasticsearch

Create Elasticsearch indices, mappings and documents -- without any code!

No frills, no config!

It's so 0.0.3, it can't even be configured for an Elasticsearch node other than localhost or a node that needs authentication!

## CLI

### Setup

Install globally

```bash
npm i -g velcro
velcro strap
```

Or npx it

```bash
npx velcro strap
```

Or put it in an npm script, so you can `npm run velcro` it

```json
{
  "scripts": {
    "velcro": "velcro strap"
  },
  "devDependencies": {
    "velcro": "0.0.1"
  }
}
```

### `strap` command

`velcro strap` will create all indices and mappings found in the current working directory's `velcro.yaml` file

```yaml
---
indices:
  my-index-name:
    properties:
      a_field_name: keyword
      another_field: text
  my-other-index:
    properties:
      created_when: date
```

## Testing

### `createVelcroTestStrap`

A test strap manages indices and mappings for execution of a test. Indices are created with an alternate name to isolate test state from previous executions.

```javascript
import {createVelcroTestStrap} from 'velcro'

const velcro = await createVelcroTestStrap({
    elasticsearch: {client},
    indices: ['my-index-name'],
    documents: [
        {
            a_field_name: "value",
            another_field: "text",
        }
    ]
})

// do some testing

await velcro.cleanup()
```

`createVelcroTestStrap` will refresh any indices that documents were created in so they're ready to be searched when `createVelcroTestStrap` completes.

Created index names and document ids can be retrieved using `VelcroTestStrap.managedIndexName()`, `VelcroTestStrap.documentIds()` and `VelcroTestStrap.documentId()`.

`velcroTestStrap.managedIndexName('my-index-name')` will return the index name used to isolate testing from other data and operations during the scope of the test.

`velcroTestStrap.documentsIds('my-index-name')` will return an array of all document ids created for the specified index.

`velcroTestStrap.documentsId('my-index-name', 0)` will return a specific document id using the index of the array in `createVelcroTestStrap`'s `opts.documents` array.

## Caveat

Only happy paths and no testing. Bugs gauranteed!
