<h2 id="posters" style="margin: 2px 0px -15px;">Conference Posters</h2>

<div class="posters" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-top: 30px;">

{% for poster in site.data.posters.main %}

<div style="text-align: center;">
  <a href="{{ poster.pdf }}" target="_blank">
    <img src="{{ poster.image }}" style="width: 100%; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
  </a>
  <p style="margin-top: 15px; font-weight: 500; color: #333;">{{ poster.conference }}</p>
</div>

{% endfor %}

</div>
