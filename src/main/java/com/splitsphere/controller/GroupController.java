package com.splitsphere.controller;

import com.splitsphere.dto.group.CreateGroupRequest;
import com.splitsphere.dto.group.GroupMemberResponse;
import com.splitsphere.dto.group.GroupResponse;
import com.splitsphere.dto.group.JoinGroupRequest;
import com.splitsphere.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public List<GroupResponse> myGroups() {
        return groupService.myGroups();
    }

    @GetMapping("/{groupId}")
    public GroupResponse getGroup(@PathVariable UUID groupId) {
        return groupService.getGroupForCurrentUser(groupId);
    }

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(request));
    }

    @PostMapping("/join")
    public GroupResponse joinGroup(@Valid @RequestBody JoinGroupRequest request) {
        return groupService.joinGroup(request);
    }

    @GetMapping("/{groupId}/members")
    public List<GroupMemberResponse> members(@PathVariable UUID groupId) {
        return groupService.members(groupId);
    }

    @PostMapping("/{groupId}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveGroup(@PathVariable UUID groupId) {
        groupService.leaveGroup(groupId);
    }

    @DeleteMapping("/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroup(@PathVariable UUID groupId) {
        groupService.deleteGroup(groupId);
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable UUID groupId, @PathVariable UUID userId) {
        groupService.removeMember(groupId, userId);
    }

    @PostMapping("/{groupId}/invite-code")
    public GroupResponse regenerateInviteCode(@PathVariable UUID groupId) {
        return groupService.regenerateInviteCode(groupId);
    }
}
