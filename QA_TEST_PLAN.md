# QA Test Plan - Group Member and Invite Code Functionality

**Date:** December 29, 2024  
**Related Migration:** `20251229000000_fix_group_member_and_invite_issues.sql`  
**Status:** Ready for Testing

## Overview

This test plan covers the critical functionality fixes related to group member management and invite code joining. The migration addresses RLS policy issues that prevented users from joining groups via invite codes and group creators from adding members.

## Pre-Test Checklist

- [ ] Migration `20251229000000_fix_group_member_and_invite_issues.sql` has been applied to the test database
- [ ] At least 2 user accounts exist (User A and User B)
- [ ] Both users are authenticated and can access the application
- [ ] Browser console is open to monitor for errors
- [ ] Network tab is open to verify API calls

---

## Test Scenarios

### Scenario 1: Group Creator Adding Members

**Objective:** Verify that group creators can successfully add other users to their groups.

**Pre-conditions:**
- User A is logged in
- User A has created at least one group
- User B exists in the system (may or may not be logged in)

**Test Steps:**
1. Log in as User A
2. Navigate to an existing group or create a new group
3. Click "Add Members" button (or equivalent action)
4. Verify that a list of all users is displayed (excluding User A)
5. Select User B from the list
6. Click "Add" or "Save" to add User B
7. Verify success toast message appears
8. Verify User B appears in the group members list

**Expected Results:**
- ✅ All users are visible in the "Add Members" modal
- ✅ User A can select and add User B
- ✅ Success message displays: "Medlemmar tillagda" (or similar)
- ✅ User B appears in the group members list immediately
- ✅ No errors in browser console
- ✅ RLS policy allows: `is_group_creator(auth.uid(), group_id)` = true

**Verification:**
- [ ] User list loads correctly
- [ ] User B can be selected
- [ ] User B is added successfully
- [ ] User B appears in members list
- [ ] No console errors
- [ ] No network errors (check for 200/201 status codes)

---

### Scenario 2: User Joining via Invite Code

**Objective:** Verify that users can join groups using valid invite codes.

**Pre-conditions:**
- User A has created a group with an invite code
- User B is logged in (different from User A)
- User B is NOT already a member of the group

**Test Steps:**
1. Log in as User A
2. Navigate to a group
3. Copy the invite code (6-character code, e.g., "ABC123")
4. Log out and log in as User B
5. Click "Join Group" button (or equivalent)
6. Enter the invite code copied from User A's group
7. Click "Join" or "Gå med"
8. Verify success message appears
9. Verify User B can now see the group in their groups list
10. Navigate to the group and verify User B is listed as a member

**Expected Results:**
- ✅ Invite code lookup succeeds
- ✅ User B can join the group successfully
- ✅ Success message displays: "Du gick med i [Group Name]"
- ✅ Group appears in User B's groups list
- ✅ User B is listed as a member in the group
- ✅ No errors in browser console
- ✅ RLS policy allows: `auth.uid() = user_id` = true (self-join)

**Verification:**
- [ ] Invite code is accepted
- [ ] User B joins successfully
- [ ] Group appears in User B's dashboard
- [ ] User B is visible in group members list
- [ ] No console errors
- [ ] Network call to `group_members` table succeeds (status 201)

**Edge Cases to Test:**
- [ ] Test with invite code in lowercase (should convert to uppercase)
- [ ] Test with invite code with spaces (should be trimmed)
- [ ] Test with partial code (should show validation error)
- [ ] Test with code less than 6 characters (button should be disabled)

---

### Scenario 3: Viewing All Users

**Objective:** Verify that all users are visible in the "Add Members" modal, regardless of RLS policies.

**Pre-conditions:**
- User A is logged in
- At least 2 other users exist in the system
- User A has created a group

**Test Steps:**
1. Log in as User A
2. Navigate to a group
3. Click "Add Members" button
4. Verify the modal opens
5. Verify a list of users is displayed
6. Verify the current user (User A) is NOT in the list
7. Verify all other users are visible
8. Verify user names are displayed correctly

**Expected Results:**
- ✅ Modal opens successfully
- ✅ List of users loads (may show loading state briefly)
- ✅ Current user is filtered out from the list
- ✅ All other users are visible
- ✅ User names are displayed correctly
- ✅ No errors in browser console
- ✅ `get_all_users()` function bypasses RLS (SECURITY DEFINER)

**Verification:**
- [ ] Users list loads
- [ ] Current user is excluded
- [ ] All other users are visible
- [ ] User names are correct
- [ ] No console errors
- [ ] Network call to `get_all_users` RPC succeeds

---

### Scenario 4: Invalid Invite Code

**Objective:** Verify proper error handling when an invalid invite code is entered.

**Pre-conditions:**
- User B is logged in
- User B knows an invalid invite code (or random 6-character string)

**Test Steps:**
1. Log in as User B
2. Click "Join Group" button
3. Enter an invalid invite code (e.g., "ZZZ999")
4. Click "Join" or "Gå med"
5. Verify error message appears
6. Check browser console for detailed error logging

**Expected Results:**
- ✅ Error toast message displays: "Ogiltig kod" with description "Ingen grupp hittades med den koden."
- ✅ Detailed error is logged to console
- ✅ User remains on the join group modal
- ✅ User can try again with a different code
- ✅ No network errors (should return 200 but with empty result)

**Verification:**
- [ ] Error message is user-friendly
- [ ] Detailed error logged to console
- [ ] Modal remains open
- [ ] User can retry
- [ ] No unhandled exceptions

---

### Scenario 5: Duplicate Member Prevention

**Objective:** Verify that users cannot be added as members twice.

**Pre-conditions:**
- User A has created a group
- User B is already a member of the group

**Test Steps - Add Members Modal:**
1. Log in as User A
2. Navigate to the group
3. Click "Add Members"
4. Verify User B is still in the list
5. Attempt to select and add User B again
6. Verify behavior (should either prevent selection or show error)

**Test Steps - Invite Code:**
1. Log in as User B (already a member)
2. Click "Join Group"
3. Enter the invite code for the group User B is already in
4. Click "Join"
5. Verify info message appears

**Expected Results:**
- ✅ Database unique constraint prevents duplicate entries
- ✅ If attempting via invite code: Info message "Du är redan medlem i denna grupp"
- ✅ If attempting via Add Members: Either prevented at UI level or database prevents it
- ✅ No duplicate members appear in the list
- ✅ No errors in console

**Verification:**
- [ ] Duplicate addition is prevented
- [ ] Appropriate message displayed
- [ ] No database errors
- [ ] Member list shows only one instance of User B

---

### Scenario 6: Group Creator Auto-Membership

**Objective:** Verify that group creators are automatically added as members when creating a group.

**Pre-conditions:**
- User A is logged in
- User A has not created any groups yet (or test with a new group)

**Test Steps:**
1. Log in as User A
2. Click "Create Group" or "Ny grupp"
3. Enter a group name
4. Optionally select other members to add
5. Click "Create" or "Skapa"
6. Navigate to the newly created group
7. Verify User A appears in the members list

**Expected Results:**
- ✅ Group is created successfully
- ✅ User A is automatically added as a member
- ✅ User A appears in the members list
- ✅ Database trigger `auto_add_group_creator_as_member` executes
- ✅ No manual action needed to add creator as member

**Verification:**
- [ ] Group created successfully
- [ ] Creator is in members list
- [ ] No manual member addition needed
- [ ] Database trigger executed correctly

---

## Security Testing

### Test 1: Unauthorized Access Prevention

**Objective:** Verify that users cannot add members to groups they didn't create.

**Pre-conditions:**
- User A created Group 1
- User B is logged in and is a member of Group 1 (but not the creator)
- User C exists in the system

**Test Steps:**
1. Log in as User B (not the creator)
2. Navigate to Group 1
3. Attempt to add User C as a member
4. Verify behavior

**Expected Results:**
- ❌ User B should NOT be able to add members (if UI allows, RLS should block)
- ✅ RLS policy should prevent: `is_group_creator(auth.uid(), group_id)` = false
- ✅ Error should occur if attempted via direct API call

**Verification:**
- [ ] UI either hides "Add Members" button for non-creators, OR
- [ ] RLS policy blocks the insert operation
- [ ] Appropriate error message displayed

---

### Test 2: RLS Policy Verification

**Objective:** Verify RLS policies work correctly for group_members table.

**Manual SQL Verification (Optional):**
```sql
-- As User A (creator of Group 1):
-- Should succeed:
INSERT INTO group_members (group_id, user_id) 
VALUES ('group-1-id', 'user-b-id');

-- As User B (not creator, but can self-join):
-- Should succeed:
INSERT INTO group_members (group_id, user_id) 
VALUES ('group-1-id', 'user-b-id');

-- As User C (not creator, trying to add User D):
-- Should fail:
INSERT INTO group_members (group_id, user_id) 
VALUES ('group-1-id', 'user-d-id');
```

---

## Integration Testing

### Test 1: Full User Flow - Create and Join

**Objective:** Test the complete flow of creating a group and having another user join.

**Test Steps:**
1. User A creates a new group "Test Group"
2. User A notes the invite code
3. User A adds User B via "Add Members" modal
4. Verify User B appears as member
5. User A shares invite code with User C
6. User C joins using invite code
7. Verify User C appears as member
8. All three users can see the group and all members

**Expected Results:**
- ✅ All steps complete successfully
- ✅ All members are visible to all group members
- ✅ Group is accessible to all members
- ✅ No errors throughout the flow

---

### Test 2: Expense Sharing After Join

**Objective:** Verify that new members can see and participate in expenses.

**Test Steps:**
1. User A creates group and adds expense
2. User B joins group via invite code
3. User B navigates to group
4. Verify User B can see existing expenses
5. Verify User B can add new expenses
6. Verify balances are calculated correctly including User B

**Expected Results:**
- ✅ User B can see all expenses
- ✅ User B can add expenses
- ✅ Balances include User B
- ✅ Settlements work correctly with all members

---

## Performance Testing

### Test 1: Large User List

**Objective:** Verify performance when many users exist.

**Test Steps:**
1. Ensure 50+ users exist in system (may need test data)
2. Log in as User A
3. Create group and click "Add Members"
4. Verify modal loads within reasonable time (< 2 seconds)
5. Verify scrolling works smoothly
6. Select a user and add
7. Verify operation completes successfully

**Expected Results:**
- ✅ Modal loads within 2 seconds
- ✅ Scrolling is smooth
- ✅ User selection works correctly
- ✅ No performance degradation

---

## Error Handling Testing

### Test 1: Network Failures

**Objective:** Verify graceful handling of network failures.

**Test Steps:**
1. Open browser DevTools > Network tab
2. Set throttling to "Offline" or block network requests
3. Attempt to join group via invite code
4. Verify error handling
5. Restore network
6. Retry operation

**Expected Results:**
- ✅ Error message displayed to user
- ✅ No unhandled exceptions
- ✅ User can retry after network restored
- ✅ Operation succeeds after network restored

---

### Test 2: Database Errors

**Objective:** Verify handling of database constraint violations.

**Pre-conditions:**
- User A and User B are already members of Group 1

**Test Steps:**
1. Attempt to add User B to Group 1 again (via SQL or if UI allows)
2. Verify error handling
3. Verify user-friendly error message

**Expected Results:**
- ✅ Database constraint prevents duplicate
- ✅ Error is caught and handled
- ✅ User sees appropriate error message
- ✅ Application doesn't crash

---

## Regression Testing

### Test 1: Existing Functionality Still Works

**Objective:** Verify that existing functionality hasn't been broken.

**Test Scenarios:**
- [ ] Users can still create groups
- [ ] Users can still add expenses
- [ ] Users can still view balances
- [ ] Users can still create settlements
- [ ] Users can still delete groups
- [ ] Users can still edit expenses
- [ ] All existing features work as before

---

## Browser Compatibility

Test in the following browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Test Execution Log

| Test ID | Test Scenario | Status | Tester | Date | Notes |
|---------|--------------|--------|--------|------|-------|
| 1 | Group Creator Adding Members | ⬜ | | | |
| 2 | User Joining via Invite Code | ⬜ | | | |
| 3 | Viewing All Users | ⬜ | | | |
| 4 | Invalid Invite Code | ⬜ | | | |
| 5 | Duplicate Member Prevention | ⬜ | | | |
| 6 | Group Creator Auto-Membership | ⬜ | | | |
| S1 | Unauthorized Access Prevention | ⬜ | | | |
| S2 | RLS Policy Verification | ⬜ | | | |
| I1 | Full User Flow | ⬜ | | | |
| I2 | Expense Sharing After Join | ⬜ | | | |

**Status Legend:**
- ✅ Pass
- ❌ Fail
- ⬜ Not Started
- ⚠️ Partial Pass (with notes)

---

## Known Issues

Document any issues found during testing:

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |

---

## Sign-Off

**Tested By:** ___________________  
**Date:** ___________________  
**Status:** ⬜ Pass / ❌ Fail / ⚠️ Partial Pass

**Notes:**
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

---

## Post-Test Actions

- [ ] All test results documented
- [ ] Any bugs/issues logged
- [ ] Migration verified as successful
- [ ] Production deployment approved (if all tests pass)
- [ ] Monitoring set up for production deployment

