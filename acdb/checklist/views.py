import json

from django.http import Http404, HttpResponse
from django.shortcuts import render

from checklist.models import Fish, FishSchedule, Bug, BugSchedule


def api_species(request, species):
    species_response = list()
    schedules = list()
    if species == "fish":
        species_response = list(Fish.objects.order_by('slot').values())
        schedules = list(FishSchedule.objects
                         .extra(select={'species_id': 'fish'}).values())
    elif species == "bug":
        species_response = list(Bug.objects.order_by('slot').values())
        schedules = list(BugSchedule.objects
                         .extra(select={'species_id': 'bug'}).values())
        pass
    else:
        raise Http404

    for s in schedules:
        dict_schedule = {
            'month': {'start': s['month_start'], 'end': s['month_end']},
            'day': {'start': s['day_start'], 'end': s['day_end']},
            'hour': {'start': s['hour_start'], 'end': s['hour_end']}
        }
        species_response[s['species_id']-1] \
            .setdefault('schedule', []) \
            .append(dict_schedule)
    return HttpResponse(json.dumps(species_response, indent=4))


def checklist(request):
    '''fish_list = Fish.objects.order_by('slot')
    bug_list = Bug.objects.order_by('slot')
    context = {
        'fish_list': fish_list,
        'bug_list': bug_list
    }'''
    return render(request, 'base.html')


def import_data(request, completion_data):
    # if user confirms import:
    #   set cookie completion_data
    #   redirect to index
    return HttpResponse("yo")
