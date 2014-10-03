from django.http import HttpResponse
from django.shortcuts import render


def checklist(request, completion_data):
    return HttpResponse("Hello!" + completion_data)
