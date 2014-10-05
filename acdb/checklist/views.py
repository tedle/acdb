from django.http import HttpResponse
from django.shortcuts import render

from checklist.models import Fish, Bug


def checklist(request):
    fish_list = Fish.objects.order_by('slot')
    bug_list = Bug.objects.order_by('slot')
    context = {
        'fish_list': fish_list,
        'bug_list': bug_list
    }
    return render(request, 'base.html')


def import_data(request, completion_data):
    # if user confirms import:
    #   set cookie completion_data
    #   redirect to index
    return HttpResponse("yo")
