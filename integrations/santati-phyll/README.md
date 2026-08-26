# Santati Phyll Integration

Purpose: prove that a Phyll agent can encounter a paid x402 resource, determine whether purchasing it is permitted, obtain human approval when required, execute the payment, consume the resource, and leave an auditable transaction record.

This is not a Santati production repository and does not modify Santati production code.

Initial mocked example:

1. Phyll needs company verification.
2. Provider responds with HTTP 402.
3. Resource costs `$0.01`.
4. `payment-policy` approves.
5. Mock Seeker wallet signs/pays.
6. Phyll receives verification.
7. `transaction-audit` records the action.
