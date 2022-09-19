<ul data-cid="{cid}">
{{{ each categories }}}
  <li data-cid="{categories.cid}" data-parent-cid="{categories.parentCid}" data-name="{categories.name}" {{{ if categories.disabled }}}class="disabled"{{{ end }}}>
    <div class="form-check">
      <label class="form-check-label">{categories.name}</label>
      <input class="form-check-input" type="checkbox" data-cid="{categories.cid}" id="{categories.cid}" name="defaultCid_{categories.cid}" title="{categories.name}" {{{ if categories.disabled }}}disabled{{{ end }}}>
    </div>
  </li>
{{{ end }}}
</ul>