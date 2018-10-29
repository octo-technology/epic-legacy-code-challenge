package paladin.inventories.gilded_rose;

public class Item {

	String name;
	int sellIn;
	int quality;
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public int getSellIn() {
		return sellIn;
	}
	public void setSellIn(int sellIn) {
		this.sellIn = sellIn;
	}
	public int getQuality() {
		return quality;
	}
	public void setQuality(int quality) {
		this.quality = quality;
	}

	@Override
	public String toString() {
		return String.format("Item{ name: %s, sellIn: %d, quality: %d }", name, sellIn, quality);
	}
	
	
}
