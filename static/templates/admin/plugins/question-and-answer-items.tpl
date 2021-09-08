<ul data-cid="{cid}">
<!-- BEGIN categories -->
  <li data-cid="{categories.cid}" data-parent-cid="{categories.parentCid}" data-name="{categories.name}" <!-- IF categories.disabled -->class="disabled"<!-- ENDIF categories.disabled -->>
    <div class="checkbox">
      <label>
        <input type="checkbox" data-cid="{categories.cid}" id="{categories.cid}" name="defaultCid_{categories.cid}" title="{categories.name}" <!-- IF categories.disabled -->disabled<!-- ENDIF categories.disabled -->>
        {categories.name}
      </label>
    </div>
  </li>
<!-- END categories -->
</ul>