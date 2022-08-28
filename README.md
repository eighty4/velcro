# Velcro for Elasticsearch

Create Elasticsearch indices, mappings and documents -- without any code!

No frills, no config!

It's so 0.0.1, it can't even be configured for an Elasticsearch node other than localhost or a node that needs authentication!

## Use

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

## Configure

Create an index and its field mappings in a `velcro.yaml` file 

```yaml
---
indices:
  my-index-name:
    properties:
      a-field-name: keyword
      another-field: text
```

## Caveat

Only happy paths and no testing. Bugs gauranteed!
