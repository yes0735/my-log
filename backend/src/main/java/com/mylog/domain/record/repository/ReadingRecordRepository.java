package com.mylog.domain.record.repository;

import com.mylog.domain.record.entity.ReadingRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReadingRecordRepository extends JpaRepository<ReadingRecord, Long> {
    List<ReadingRecord> findByUserBookIdOrderByReadDateDesc(Long userBookId);
}
