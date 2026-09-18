"""
In-memory DynamoDB Table Mock for Lelantos tests.
Accurately emulates boto3 Table resource for Single-Table Design:
- put_item
- get_item
- query (supporting Key('PK').eq(...) & Key('SK').begins_with(...))
- update_item (SET expressions with ExpressionAttributeValues and Names)
- delete_item
"""

import copy
from typing import Any, Optional
from boto3.dynamodb.conditions import And, Equals, BeginsWith, Key


class MockDynamoDBTable:
    def __init__(self, name: str = "LelantosTable"):
        self.name = name
        # Store items indexed by (PK, SK) tuple
        self.items: dict[tuple[str, str], dict[str, Any]] = {}

    def clear(self):
        self.items.clear()

    def put_item(self, Item: dict[str, Any]):
        pk = Item.get("PK")
        sk = Item.get("SK")
        if not pk or not sk:
            raise ValueError("DynamoDB items must contain PK and SK")
        self.items[(pk, sk)] = copy.deepcopy(Item)
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}

    def get_item(self, Key: dict[str, Any]) -> dict[str, Any]:
        pk = Key.get("PK")
        sk = Key.get("SK")
        item = self.items.get((pk, sk))
        if item:
            return {"Item": copy.deepcopy(item)}
        return {}

    def delete_item(self, Key: dict[str, Any]) -> dict[str, Any]:
        pk = Key.get("PK")
        sk = Key.get("SK")
        self.items.pop((pk, sk), None)
        return {"ResponseMetadata": {"HTTPStatusCode": 200}}

    def query(
        self,
        KeyConditionExpression: Any,
        ScanIndexForward: bool = True,
        Limit: Optional[int] = None,
        **kwargs,
    ) -> dict[str, Any]:
        """
        Evaluate KeyConditionExpression.
        Handles boto3.dynamodb.conditions (Key('PK').eq(...) & Key('SK').begins_with(...)).
        """
        matched_items = []

        target_pk = None
        target_sk_prefix = None
        target_sk_exact = None

        def parse_condition(cond):
            nonlocal target_pk, target_sk_prefix, target_sk_exact
            if isinstance(cond, And):
                for sub in cond._values:
                    parse_condition(sub)
            elif isinstance(cond, Equals):
                k, v = cond._values
                attr_name = k.name if hasattr(k, "name") else str(k)
                if attr_name == "PK":
                    target_pk = v
                elif attr_name == "SK":
                    target_sk_exact = v
            elif isinstance(cond, BeginsWith):
                k, v = cond._values
                attr_name = k.name if hasattr(k, "name") else str(k)
                if attr_name == "SK":
                    target_sk_prefix = v

        parse_condition(KeyConditionExpression)

        for (pk, sk), item in self.items.items():
            if target_pk is not None and pk != target_pk:
                continue
            if target_sk_exact is not None and sk != target_sk_exact:
                continue
            if target_sk_prefix is not None and not sk.startswith(target_sk_prefix):
                continue
            matched_items.append(copy.deepcopy(item))

        # Sort by SK
        matched_items.sort(key=lambda x: x.get("SK", ""), reverse=not ScanIndexForward)

        if Limit is not None:
            matched_items = matched_items[:Limit]

        return {"Items": matched_items, "Count": len(matched_items)}

    def update_item(
        self,
        Key: dict[str, Any],
        UpdateExpression: str,
        ExpressionAttributeValues: Optional[dict[str, Any]] = None,
        ExpressionAttributeNames: Optional[dict[str, Any]] = None,
        **kwargs,
    ) -> dict[str, Any]:
        pk = Key.get("PK")
        sk = Key.get("SK")
        item = self.items.get((pk, sk))
        if not item:
            item = {"PK": pk, "SK": sk}
            self.items[(pk, sk)] = item

        # Parse SET expression like: SET #updated_at = :updated_at, #val = :val
        expr_vals = ExpressionAttributeValues or {}
        expr_names = ExpressionAttributeNames or {}

        clean_expr = UpdateExpression.strip()
        if clean_expr.startswith("SET "):
            assignments = clean_expr[4:].split(",")
            for assign in assignments:
                parts = assign.strip().split("=")
                if len(parts) == 2:
                    raw_lhs = parts[0].strip()
                    raw_rhs = parts[1].strip()

                    attr_name = expr_names.get(raw_lhs, raw_lhs)
                    attr_val = expr_vals.get(raw_rhs, raw_rhs)

                    item[attr_name] = attr_val

        return {"Attributes": copy.deepcopy(item), "ResponseMetadata": {"HTTPStatusCode": 200}}
