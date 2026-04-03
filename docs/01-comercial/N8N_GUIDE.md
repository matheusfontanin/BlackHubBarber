# Guia N8N

## Padrão:
- workflows pequenos
- nomes:
  - commercial.webhook.inbound
  - commercial.router
  - commercial.customer.flow
  - commercial.booking.flow
  - commercial.owner.flow

## Subworkflows:
- shared.resolve-tenant
- shared.resolve-actor
- shared.persist-message
- shared.send-response
