package com.healthcare.teleconsult.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(nullable = false, length = 150)
    private String qualification;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @Column(name = "consultation_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "available_days", length = 50)
    private String availableDays;

    @Column(name = "available_time_start", length = 10)
    private String availableTimeStart;

    @Column(name = "available_time_end", length = 10)
    private String availableTimeEnd;

    @Column(name = "available")
    private Boolean available = true;

    @Column(name = "name", length = 255)
    private String name;

    public Doctor() {
    }

    public Doctor(User user, String specialization, String qualification, Integer experienceYears,
                  BigDecimal consultationFee, String bio, String availableDays,
                  String availableTimeStart, String availableTimeEnd) {
        this.user = user;
        this.specialization = specialization;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
        this.consultationFee = consultationFee;
        this.bio = bio;
        this.availableDays = availableDays;
        this.availableTimeStart = availableTimeStart;
        this.availableTimeEnd = availableTimeEnd;
        if (user != null) {
            this.name = user.getFullName();
        }
        this.available = true;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
        if (user != null && (this.name == null || this.name.isBlank())) {
            this.name = user.getFullName();
        }
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public BigDecimal getConsultationFee() {
        return consultationFee;
    }

    public void setConsultationFee(BigDecimal consultationFee) {
        this.consultationFee = consultationFee;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvailableDays() {
        return availableDays;
    }

    public void setAvailableDays(String availableDays) {
        this.availableDays = availableDays;
    }

    public String getAvailableTimeStart() {
        return availableTimeStart;
    }

    public void setAvailableTimeStart(String availableTimeStart) {
        this.availableTimeStart = availableTimeStart;
    }

    public String getAvailableTimeEnd() {
        return availableTimeEnd;
    }

    public void setAvailableTimeEnd(String availableTimeEnd) {
        this.availableTimeEnd = availableTimeEnd;
    }

    public Boolean getAvailable() {
        return available;
    }

    public boolean isAvailable() {
        return available != null && available;
    }

    public void setAvailable(Boolean available) {
        this.available = available != null ? available : true;
    }

    public String getName() {
        return name != null ? name : (user != null ? user.getFullName() : null);
    }

    public void setName(String name) {
        this.name = name;
    }
}

