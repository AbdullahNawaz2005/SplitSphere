package com.splitsphere.service;

import com.splitsphere.dto.group.CreateGroupRequest;
import com.splitsphere.dto.group.GroupMemberResponse;
import com.splitsphere.dto.group.GroupResponse;
import com.splitsphere.dto.group.JoinGroupRequest;
import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.GroupMember;
import com.splitsphere.entity.User;
import com.splitsphere.entity.enums.GroupRole;
import com.splitsphere.exception.BadRequestException;
import com.splitsphere.exception.ConflictException;
import com.splitsphere.exception.ForbiddenException;
import com.splitsphere.exception.ResourceNotFoundException;
import com.splitsphere.repository.ExpenseGroupRepository;
import com.splitsphere.repository.GroupMemberRepository;
import com.splitsphere.util.InputSanitizer;
import com.splitsphere.util.InviteCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final ExpenseGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final CurrentUserService currentUserService;
    private final InviteCodeGenerator inviteCodeGenerator;
    private final ActivityLogService activityLogService;

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request) {
        User user = currentUserService.getCurrentUser();
        ExpenseGroup group = new ExpenseGroup();
        group.setName(InputSanitizer.cleanText(request.name()));
        group.setOwner(user);
        group.setInviteCode(uniqueInviteCode());
        ExpenseGroup saved = groupRepository.save(group);

        GroupMember ownerMembership = new GroupMember();
        ownerMembership.setGroup(saved);
        ownerMembership.setUser(user);
        ownerMembership.setRole(GroupRole.OWNER);
        groupMemberRepository.save(ownerMembership);
        activityLogService.record(saved, user, "GROUP_CREATED", user.getName() + " created " + saved.getName());

        return GroupResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> myGroups() {
        User user = currentUserService.getCurrentUser();
        return groupMemberRepository.findByUser(user).stream()
                .map(GroupMember::getGroup)
                .sorted(Comparator.comparing(ExpenseGroup::getCreatedAt).reversed())
                .map(GroupResponse::from)
                .toList();
    }

    @Transactional
    public GroupResponse joinGroup(JoinGroupRequest request) {
        User user = currentUserService.getCurrentUser();
        ExpenseGroup group = groupRepository.findByInviteCode(request.inviteCode())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid invite code"));

        GroupMember membership = groupMemberRepository.findByGroupAndUser(group, user).orElse(null);
        if (membership != null) {
            throw new ConflictException("You are already a member of this group");
        }
        membership = new GroupMember();
        membership.setGroup(group);
        membership.setUser(user);
        membership.setRole(GroupRole.MEMBER);
        groupMemberRepository.save(membership);
        activityLogService.record(group, user, "MEMBER_JOINED", user.getName() + " joined " + group.getName());
        return GroupResponse.from(group);
    }

    @Transactional
    public void leaveGroup(UUID groupId) {
        User user = currentUserService.getCurrentUser();
        ExpenseGroup group = getGroup(groupId);
        if (group.getOwner().getId().equals(user.getId())) {
            throw new BadRequestException("Group owner cannot leave; transfer ownership or delete the group");
        }
        GroupMember membership = groupMemberRepository.findByGroupAndUser(group, user)
                .orElseThrow(() -> new ResourceNotFoundException("Group membership not found"));
        groupMemberRepository.delete(membership);
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> members(UUID groupId) {
        requireActiveMember(groupId);
        return groupMemberRepository.findByGroupId(groupId).stream()
                .sorted(Comparator.comparing(member -> member.getUser().getName()))
                .map(GroupMemberResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroupForCurrentUser(UUID groupId) {
        requireActiveMember(groupId);
        return GroupResponse.from(getGroup(groupId));
    }

    @Transactional
    public void removeMember(UUID groupId, UUID userId) {
        User owner = currentUserService.getCurrentUser();
        ExpenseGroup group = getGroup(groupId);
        if (!group.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("Only the group owner can remove members");
        }
        if (owner.getId().equals(userId)) {
            throw new BadRequestException("Group owner cannot remove themselves");
        }
        GroupMember membership = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Group membership not found"));
        groupMemberRepository.delete(membership);
        activityLogService.record(group, owner, "MEMBER_REMOVED", owner.getName() + " removed a member from " + group.getName());
    }

    @Transactional
    public GroupResponse regenerateInviteCode(UUID groupId) {
        User owner = currentUserService.getCurrentUser();
        ExpenseGroup group = getGroup(groupId);
        if (!group.getOwner().getId().equals(owner.getId())) {
            throw new ForbiddenException("Only the group owner can regenerate invite codes");
        }
        group.setInviteCode(uniqueInviteCode());
        activityLogService.record(group, owner, "INVITE_REGENERATED", owner.getName() + " regenerated the invite code");
        return GroupResponse.from(groupRepository.save(group));
    }

    @Transactional
    public void deleteGroup(UUID groupId) {
        User user = currentUserService.getCurrentUser();
        ExpenseGroup group = getGroup(groupId);
        if (!group.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("Only the group owner can delete this group");
        }
        groupRepository.delete(group);
    }

    public ExpenseGroup getGroup(UUID groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
    }

    public void requireActiveMember(UUID groupId) {
        User user = currentUserService.getCurrentUser();
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, user.getId())) {
            throw new ForbiddenException("You are not a member of this group");
        }
    }

    public void requireActiveMember(ExpenseGroup group, User user) {
        if (!groupMemberRepository.existsByGroupAndUser(group, user)) {
            throw new ForbiddenException("User is not an active member of this group");
        }
    }

    private String uniqueInviteCode() {
        String code;
        do {
            code = inviteCodeGenerator.generate();
        } while (groupRepository.existsByInviteCode(code));
        return code;
    }
}
