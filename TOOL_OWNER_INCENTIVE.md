# Free Standard Plan for Tool Owners - Implementation Guide

## Feature Overview

**Supply-Side Incentive:** Tool owners who list 3 or more active, approved tools automatically receive Standard plan benefits for free.

## Business Logic

### Automatic Granting
- When a user lists their 3rd approved, active tool → **Automatically grant Standard plan (£0/month)**
- User can borrow up to 2 tools simultaneously (Standard benefit)
- Can borrow tools up to £300 value
- Can borrow for up to 7 days

### Automatic Revocation
- If a user's active tool count drops below 3 → **Revert to their previous plan**
- Notification sent to user explaining the change
- If they had purchased Pro, they revert to Pro (not Free)
- If they had purchased Standard, they revert to Standard (with monthly charge)
- If they were on Free, they stay on Free

### Admin Override
- Admins can revoke grants if listings are fraudulent or inactive
- Admins can manually set plans for special cases
- All admin actions are logged with a reason

## Database Schema

### New Subscriptions Table Columns

```sql
ALTER TABLE subscriptions 
ADD COLUMN is_free_tool_owner_grant BOOLEAN DEFAULT FALSE,
ADD COLUMN granted_tool_count INTEGER DEFAULT NULL,
ADD COLUMN previous_plan TEXT DEFAULT NULL;

CREATE INDEX idx_subscriptions_tool_owner_grant 
ON subscriptions(user_id) 
WHERE is_free_tool_owner_grant = TRUE;
```

**Column Details:**
- `is_free_tool_owner_grant`: Marks if Standard plan was granted due to 3+ tools (vs. purchased)
- `granted_tool_count`: Number of active tools that qualified them for the grant
- `previous_plan`: The plan they had before the grant (for reverting when they drop below 3 tools)

## API Endpoints

### POST `/api/subscriptions/check-tool-count`

**Purpose:** Check user's tool count and update subscription accordingly

**Request:**
```json
{
  "userId": "user-uuid-here"
}
```

**Response Examples:**

Created (new subscription):
```json
{
  "success": true,
  "action": "created",
  "toolCount": 3,
  "subscription": { /* subscription object */ }
}
```

Upgraded (granted free Standard):
```json
{
  "success": true,
  "action": "upgraded",
  "toolCount": 3,
  "previousPlan": "free",
  "newPlan": "standard",
  "subscription": { /* subscription object */ },
  "message": "User now has 3+ tools. Granted free Standard plan"
}
```

Reverted (dropped below 3 tools):
```json
{
  "success": true,
  "action": "reverted",
  "toolCount": 2,
  "previousPlan": "standard",
  "newPlan": "free",
  "subscription": { /* subscription object */ },
  "message": "User dropped below 3 tools. Reverted from Standard (free grant) to free"
}
```

### POST `/api/admin/subscriptions/override`

**Purpose:** Admin can override subscriptions (needs admin auth)

**Request (Revoke Grant):**
```json
{
  "userId": "user-uuid",
  "action": "revoke_tool_owner_grant",
  "reason": "Fraudulent listings detected"
}
```

**Request (Set Plan):**
```json
{
  "userId": "user-uuid",
  "action": "set_plan",
  "newPlan": "pro",
  "reason": "Promotional upgrade"
}
```

## Integration Points

### 1. Tool Creation (`app/tools/add/page.tsx`)
After tool is created successfully, call:
```typescript
await fetch('/api/subscriptions/check-tool-count', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: session.user.id }),
});
```

### 2. Tool Deletion
When a tool is deleted, call the same endpoint to check if user dropped below 3 tools.

### 3. Tool Status Changes
When a tool status changes from `available` to anything else, trigger the check.

### 4. Background Job (Optional)
Run periodically (e.g., daily) to catch edge cases:
```typescript
// Pseudocode for background job
const { data: allUsers } = await supabase.from('users_ext').select('id');
for (const user of allUsers) {
  await fetch('/api/subscriptions/check-tool-count', {
    method: 'POST',
    body: JSON.stringify({ userId: user.id }),
  });
}
```

## User Communication

### When Granted
**Notification (in-app toast or email):**
```
🎉 Congratulations!

You've listed 3 active tools on Toolshare. As a thank you, we've upgraded you to our Standard plan for free!

Your benefits:
✓ Borrow up to 2 tools at once
✓ Borrow tools up to £300 value
✓ Borrow for up to 7 days

This upgrade lasts as long as you have 3+ active tools listed.
```

### When Reverted
**Notification:**
```
ℹ️ Plan Downgrade Notice

Your active tool count has dropped to 2. Your free Standard plan benefit has ended. You've been reverted to [Free/Standard/Pro].

To regain Standard benefits, list 3 or more tools again.
```

## Implementation Checklist

- [ ] Run database migration to add `is_free_tool_owner_grant`, `granted_tool_count`, `previous_plan` columns
- [ ] Deploy `/api/subscriptions/check-tool-count` endpoint
- [ ] Deploy `/api/admin/subscriptions/override` endpoint (with admin auth)
- [ ] Update tool creation flow to call check endpoint
- [ ] Update tool deletion flow to call check endpoint
- [ ] Add user notification when grant is applied
- [ ] Add user notification when grant is revoked
- [ ] Update owner dashboard to show grant status
- [ ] Create admin panel for subscription overrides
- [ ] Set up background job (optional but recommended)

## Testing Scenarios

1. **User creates 3rd tool** → Should see "Granted Standard plan" response
2. **User deletes a tool, drops to 2** → Should see "Reverted to Free" response
3. **User on Pro, creates 4th tool** → Should stay on Pro (no change)
4. **Admin revokes grant** → User reverted to previous plan with notification
5. **User creates tool, gets standard, then pays for Pro** → `previous_plan` updated to Pro when reverting

## Notes

- Only counts tools with `available: true` and `status: 'available'` (or null)
- The system is additive: Pro users aren't affected by the tool owner grant
- If a user manually purchases a plan after getting a grant, the grant tracks their old plan for reverting
- This incentivizes tool listing while keeping earning model simple (no rental fees)
