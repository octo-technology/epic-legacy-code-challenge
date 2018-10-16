package paladin.inventories.gilded_rose;

import java.util.Arrays;
import java.util.List;


public class Shop {
	
	private Item[] items;
	
	public Shop( Item[] items ) {
		this.items = items;
	}
	
	public void updateQuality() {
		for ( int i = 0; i < this.items.length; i++ ) {
			if (!this.items[i].name.equals("Aged Brie") && !this.items[i].name.equals("Backstage passes to a TAFKAL80ETC concert")) {
				if ( this.items[i].quality > 0 ) {
					if ( !this.items[i].name.equals("Sulfuras, Hand of Ragnaros") ) {
						this.items[i].quality = this.items[i].quality - 1;
					}
				} 
			} else {
				if ( this.items[i].quality < 50 ) {
					this.items[i].quality = this.items[i].quality + 1;
					if ( this.items[i].name.equals("Backstage passes to a TAFKAL80ETC concert") ) {
			            if (this.items[i].sellIn < 11) {
			                if (this.items[i].quality < 50) {
			                  this.items[i].quality = this.items[i].quality + 1;
			                }
			              }
			              if (this.items[i].sellIn < 6) {
			                if (this.items[i].quality < 50) {
			                  this.items[i].quality = this.items[i].quality + 1;
			                }
			              }
					}
				}
			}
			if (!this.items[i].name.equals("Sulfuras, Hand of Ragnaros")) {
				this.items[i].sellIn = this.items[i].sellIn - 1;
			}
			if (this.items[i].sellIn < 0) {
				if (!this.items[i].name.equals("Aged Brie")) {
					if (!this.items[i].name.equals("Backstage passes to a TAFKAL80ETC concert")) {
						if (this.items[i].quality > 0) {
							if (!this.items[i].name.equals("Sulfuras, Hand of Ragnaros")) {
								this.items[i].quality = this.items[i].quality - 1;
							}
						}
					} else {
						this.items[i].quality = this.items[i].quality - this.items[i].quality;
					}
				} else {
					if (this.items[i].quality < 50) {
						this.items[i].quality = this.items[i].quality + 1;
					}
				}
			}
		}
	}

	public List<Item> getItems() {
		return Arrays.asList(items);
	}
	
	

}
