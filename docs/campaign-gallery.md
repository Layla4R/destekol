# Campaign photo gallery

The gallery is the last block of campaign details, before the site footer. It shows a large image and a row of thumbnails. Inactive thumbnails are faded; the selected one stays clear. Desktop shows six thumbnails per row; mobile uses a horizontally scrollable strip. The donation sidebar stays sticky alongside the campaign content.

Autoplay advances once every **1000 ms**, only while the gallery is visible and the browser tab is active. Hovering or focusing the thumbnails pauses it. Selecting a thumbnail stops autoplay so the chosen image can be inspected. The play/pause control can restart it. Reduced-motion preferences default to paused playback and remove transitions. All labels are available in Arabic, Turkish, English and French.

Admin → Campaigns → Edit → **Campaign gallery / معرض صور الحملة**. Upload/add, remove or reorder up to 20 images, then save. Campaign.gallery is an ordered JSONB array in the private destekol schema. URLs are validated by the API. When no gallery has been set, the current campaign cover is shown as a single image; no unrelated campaign images are inserted.

Six baby-milk photos were selected by reviewing all 63 images in the user-provided Drive folder: IMG_6731.JPG, IMG_6730.JPG, IMG_6771.JPG, IMG_6748.JPG, IMG_6724.JPG, IMG_6519.JPG. The sequence includes five different family delivery scenes and one preparation/stock scene. Images retain their full framing, are resized to a maximum of 1800px, and are JPEG-optimised without carrying original EXIF metadata. Original Drive files are unchanged.
