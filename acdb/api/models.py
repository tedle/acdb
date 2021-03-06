from __future__ import unicode_literals

from django.db import models


class Bug(models.Model):
    slot = models.IntegerField(primary_key=True, blank=False)
    name = models.CharField(max_length=30)
    location = models.CharField(max_length=30)
    value = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'bug'


class BugSchedule(models.Model):
    id = models.AutoField(primary_key=True)
    bug = models.ForeignKey(Bug, db_column='bug')
    month_start = models.IntegerField(blank=False)
    month_end = models.IntegerField(blank=False)
    day_start = models.IntegerField(blank=False)
    day_end = models.IntegerField(blank=False)
    hour_start = models.IntegerField(blank=False)
    hour_end = models.IntegerField(blank=False)

    class Meta:
        managed = False
        db_table = 'bug_schedule'


class Fish(models.Model):
    slot = models.IntegerField(primary_key=True, blank=False)
    name = models.CharField(max_length=30)
    location = models.CharField(max_length=30)
    shadow = models.CharField(max_length=10)
    value = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'fish'


class FishSchedule(models.Model):
    id = models.AutoField(primary_key=True)
    fish = models.ForeignKey(Fish, db_column='fish')
    month_start = models.IntegerField(blank=False)
    month_end = models.IntegerField(blank=False)
    day_start = models.IntegerField(blank=False)
    day_end = models.IntegerField(blank=False)
    hour_start = models.IntegerField(blank=False)
    hour_end = models.IntegerField(blank=False)

    class Meta:
        managed = False
        db_table = 'fish_schedule'
