import json

from django.http import Http404, HttpResponse
from django.shortcuts import render

from checklist.models import Fish, Bug


def api_species(request, species):
    species_response = list()
    if species == "fish":
        species_response = list(Fish.objects.order_by('slot').values())
    elif species == "bug":
        species_response = list(Bug.objects.order_by('slot').values())
        pass
    else:
        raise Http404
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
