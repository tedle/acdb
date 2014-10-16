# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Bug',
            fields=[
            ],
            options={
                'db_table': 'bug',
                'managed': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='BugSchedule',
            fields=[
            ],
            options={
                'db_table': 'bug_schedule',
                'managed': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Fish',
            fields=[
            ],
            options={
                'db_table': 'fish',
                'managed': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='FishSchedule',
            fields=[
            ],
            options={
                'db_table': 'fish_schedule',
                'managed': False,
            },
            bases=(models.Model,),
        ),
    ]
