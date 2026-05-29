package com.splitsphere.service;

import com.splitsphere.dto.activity.ActivityLogResponse;
import com.splitsphere.dto.common.PageResponse;
import com.splitsphere.entity.ActivityLog;
import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.User;
import com.splitsphere.repository.ActivityLogRepository;
import com.splitsphere.util.InputSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(ExpenseGroup group, User user, String action, String description) {
        ActivityLog activityLog = new ActivityLog();
        activityLog.setGroup(group);
        activityLog.setUser(user);
        activityLog.setAction(InputSanitizer.cleanText(action));
        activityLog.setDescription(InputSanitizer.cleanText(description));
        activityLogRepository.save(activityLog);
    }

    @Transactional(readOnly = true)
    public PageResponse<ActivityLogResponse> groupActivity(UUID groupId, int page, int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(activityLogRepository.findByGroupId(groupId, pageable).map(ActivityLogResponse::from));
    }
}
