package com.competition.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.competition.entity.CrawlerTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CrawlerTaskMapper extends BaseMapper<CrawlerTask> {

    @Select("SELECT * FROM crawler_task WHERE status = 1")
    List<CrawlerTask> selectActiveTasks();

    @Select("SELECT * FROM crawler_task WHERE status = 1")
    List<CrawlerTask> selectRunningTasks();
}
