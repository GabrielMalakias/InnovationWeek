# This migration comes from doodle (originally 20160320142142)
class CreateDoodleKeywords < ActiveRecord::Migration
  def change
    create_table :doodle_keywords do |t|
      t.string :name
      t.string :value
      t.string :type

      t.timestamps null: false
    end
  end
end
