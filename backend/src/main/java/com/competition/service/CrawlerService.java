package com.competition.service;

import com.competition.entity.CrawlerTask;
import java.util.List;
import java.util.Map;

public interface CrawlerService {

    List<CrawlerTask> listTasks();

    void runTask(Integer taskId);

    void startTask(Integer id);

    void stopTask(Integer id);

    void addTask(CrawlerTask task);

    void deleteTask(Integer id);

    Map<String, Object> getProgress(Integer id);

    List<com.competition.entity.Competition> getTaskCompetitions(Integer taskId);

	void scheduledCrawl();
}