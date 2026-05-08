# Product Feed

`GET /feeds/products.json` — public, machine-readable product feed for search engines, AI surfaces, and future commerce protocols (FR-036).

## Caching

Response headers:

```
Cache-Control: public, s-maxage=300, stale-while-revalidate=60
Content-Type: application/json
```

Edge-cached for 5 minutes; on-demand revalidated when admin publishes/archives a product (`revalidatePath('/feeds/products.json')`).

## Response

Matches `schemas/product-feed.schema.json`.

```json
{
  "feed_version": "1.0",
  "generated_at": "2026-05-08T00:00:00Z",
  "merchant": {
    "name": "Open Empower B.V.",
    "store": "CopyPasteLearn",
    "country": "NL"
  },
  "items": [
    {
      "id": "ansiblepilot_automation_playbook",
      "title": "Ansible Automation Playbook",
      "description": "Practical Ansible examples for Linux, cloud, and automation workflows.",
      "url": "https://copypastelearn.com/products/ansible-automation-playbook",
      "image_url": "https://copypastelearn.com/images/ansible-automation-playbook.jpg",
      "price": { "amount": "29.00", "currency": "EUR" },
      "availability": "in_stock",
      "brand": "AnsiblePilot",
      "category": "Digital Goods > Books > Ebooks",
      "format": "PDF",
      "type": "EBOOK",
      "seller": "Open Empower B.V.",
      "updated_at": "2026-05-08T00:00:00Z"
    }
  ]
}
```

## Inclusion rules

- Only rows with `Product.status = PUBLISHED` or `Bundle.status = PUBLISHED`.
- Bundles appear as their own feed items (with `type: "BUNDLE"`).
- Archived items MUST NOT appear (FR-036).
- File URLs MUST NOT appear anywhere in the feed (FR-040).

## Validation

Contract test asserts response against `schemas/product-feed.schema.json` and that all `items[].id` are unique and all `items[].url` are HTTPS absolute URLs on the storefront origin.
