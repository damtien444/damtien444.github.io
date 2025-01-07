<ol>
    {% assign sorted_reflections = site.reflections | sort: 'date' | reverse %}
    {% for reflection in sorted_reflections %}
        {% if reflection.date <= site.time %}
            <li>
                <a href="{{ reflection.url }}">{{ reflection.title }}</a><br>
                <small>{{ reflection.date | date: "%B %d, %Y" }}</small>
            </li>
        {% endif %}
    {% endfor %}
</ol>