<ul data-cid="{cid}">
{{{ each categories }}}
  <li data-cid="{./cid}" data-parent-cid="{./parentCid}" data-name="{./name}" {{{ if ./disabled }}}class="disabled"{{{ end }}}>
    <div class="form-check">
      <label class="form-check-label">{./name}</label>
      <input class="form-check-input" type="checkbox" data-cid="{./cid}" id="{./cid}" name="defaultCid_{./cid}" title="{./name}" {{{ if ./disabled }}}disabled{{{ end }}}>
    </div>
  </li>
{{{ end }}}
</ul>